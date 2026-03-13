CREATE OR REPLACE FUNCTION public.claim_worker_profile()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_auth_user_id uuid := auth.uid();
  v_phone text;
  v_worker_id uuid;
BEGIN
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT wp.id
  INTO v_worker_id
  FROM public.workers_public wp
  WHERE wp.user_id = v_auth_user_id
     OR wp.id = v_auth_user_id
  ORDER BY CASE WHEN wp.user_id = v_auth_user_id THEN 0 ELSE 1 END
  LIMIT 1;

  IF v_worker_id IS NOT NULL THEN
    RETURN v_worker_id;
  END IF;

  SELECT u.phone
  INTO v_phone
  FROM auth.users u
  WHERE u.id = v_auth_user_id;

  IF v_phone IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.workers_public wp
  SET user_id = v_auth_user_id,
      phone = COALESCE(wp.phone, v_phone)
  WHERE wp.id = (
    SELECT candidate.id
    FROM public.workers_public candidate
    WHERE candidate.user_id IS NULL
      AND right(regexp_replace(COALESCE(candidate.phone, ''), '\D', '', 'g'), 10) =
          right(regexp_replace(v_phone, '\D', '', 'g'), 10)
    ORDER BY candidate.created_at ASC
    LIMIT 1
  )
  RETURNING wp.id INTO v_worker_id;

  RETURN v_worker_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_worker_profile() TO authenticated;

CREATE OR REPLACE FUNCTION public.enqueue_push_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := 'https://vviyjdazrnbbxypxcuxf.supabase.co/functions/v1/push-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2aXlqZGF6cm5iYnh5cHhjdXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NjEwMjcsImV4cCI6MjA4MDMzNzAyN30.D7CYp3IyMCJUZmDZThOaIAIQ3_kGKAyAeZlbuN9-dCs'
    ),
    body := jsonb_build_object(
      'user_id', NEW.user_id,
      'title', NEW.title,
      'body', NEW.message,
      'data', COALESCE(NEW.metadata, '{}'::jsonb)
    ),
    timeout_milliseconds := 15000
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_enqueue_push_notification ON public.notifications;

CREATE TRIGGER tr_enqueue_push_notification
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_push_notification();
