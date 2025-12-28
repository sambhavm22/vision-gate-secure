-- Add rating columns to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS rating INT CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS review TEXT;

-- RLS: Allow customers to update their own bookings if they are completed
-- Note: 'Users see own bookings' (SELECT) and 'Users can cancel requested bookings' (UPDATE) likely exist.
-- We need a specific policy for rating.
CREATE POLICY "Users can rate completed bookings"
ON public.bookings
FOR UPDATE
USING (
  auth.uid() = customer_id 
  AND status = 'completed'
)
WITH CHECK (
  auth.uid() = customer_id 
  AND status = 'completed' 
  AND rating IS NOT NULL -- Ensure they are actually setting a rating
);

-- Function to aggregate ratings for a worker
CREATE OR REPLACE FUNCTION public.update_worker_rating_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_worker_id uuid;
  v_avg_rating numeric;
  v_count int;
BEGIN
  -- We only care if rating is changed
  IF NEW.rating IS NOT DISTINCT FROM OLD.rating THEN
    RETURN NEW;
  END IF;

  v_worker_id := NEW.worker_id;
  
  -- Calculate new stats
  SELECT 
    ROUND(AVG(rating)::numeric, 1), 
    COUNT(id)
  INTO 
    v_avg_rating, 
    v_count
  FROM public.bookings
  WHERE worker_id = v_worker_id
    AND rating IS NOT NULL;

  -- Update worker profile
  UPDATE public.workers_public
  SET 
    rating = COALESCE(v_avg_rating, 0),
    total_reviews = COALESCE(v_count, 0)
  WHERE id = v_worker_id;

  RETURN NEW;
END;
$$;

-- Trigger
DROP TRIGGER IF EXISTS update_worker_rating_trigger ON public.bookings;
CREATE TRIGGER update_worker_rating_trigger
AFTER UPDATE OF rating ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_worker_rating_stats();
