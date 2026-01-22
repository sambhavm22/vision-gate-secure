-- 1. Harden 'bookings' RLS: Remove public visibility of unassigned bookings.
-- Only Admins, the Customer, or the Assigned Worker can view a booking directly.
-- Workers viewing the market feed must use the SECURITY DEFINER RPC 'get_market_bookings_v2'.

DROP POLICY IF EXISTS "View bookings" ON public.bookings;

CREATE POLICY "View bookings" ON public.bookings
FOR SELECT
TO public
USING (
    (select auth.uid()) = customer_id 
    OR 
    (select auth.uid()) = worker_id 
    OR 
    public.is_admin()
);

-- 2. Secure 'get_market_subscriptions' RPC
-- Make it SECURITY DEFINER so it can access bookings denied by RLS
-- Set search_path for security best practice
ALTER FUNCTION public.get_market_subscriptions(uuid, int) 
SECURITY DEFINER 
SET search_path = public, extensions;

-- 3. Harden 'recurring_bookings' RLS: Remove public visibility of unassigned subscriptions.
-- Only the Owner or Preferred Worker (if assigned) can view.
-- Market feed access must go through the now-secure RPC.

DROP POLICY IF EXISTS "View recurring bookings" ON public.recurring_bookings;

CREATE POLICY "View recurring bookings" ON public.recurring_bookings
FOR SELECT
TO public
USING (
    (select auth.uid()) = user_id 
    OR 
    (select auth.uid()) = preferred_worker_id
);
