-- Migration: Fix worker visibility for bookings and addresses
-- Enable workers to see available jobs (marketplace) and their assigned jobs.

-- 1. Bookings Policies
-- Allow workers to see requested bookings (Marketplace)
DROP POLICY IF EXISTS "Workers can see requested bookings" ON public.bookings;
CREATE POLICY "Workers can see requested bookings"
    ON public.bookings
    FOR SELECT
    TO authenticated
    USING (status = 'requested');

-- Allow workers to see bookings assigned to them
DROP POLICY IF EXISTS "Workers can see assigned bookings" ON public.bookings;
CREATE POLICY "Workers can see assigned bookings"
    ON public.bookings
    FOR SELECT
    TO authenticated
    USING (worker_id = auth.uid());

-- Allow workers to update bookings assigned to them (accepting, changing status)
DROP POLICY IF EXISTS "Workers can accept and update assigned bookings" ON public.bookings;
CREATE POLICY "Workers can accept and update assigned bookings"
    ON public.bookings
    FOR UPDATE
    TO authenticated
    USING (status = 'requested' OR worker_id = auth.uid())
    WITH CHECK (worker_id = auth.uid());

-- 2. Address Policies
-- Workers need to see the address of the jobs they are browsing or performing
DROP POLICY IF EXISTS "Workers can see booking addresses" ON public.addresses;
CREATE POLICY "Workers can see booking addresses"
    ON public.addresses
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.address_id = public.addresses.id
            AND (b.status = 'requested' OR b.worker_id = auth.uid())
        )
    );

-- 3. Worker Profile Policies
-- Allow workers to update their own profile (location, bio, etc)
DROP POLICY IF EXISTS "Workers can update own profile" ON public.workers_public;
CREATE POLICY "Workers can update own profile"
    ON public.workers_public
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
