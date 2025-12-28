-- Migration: Performance Indexes for Supabase Backend
-- Generated: 2025-12-27
-- Purpose: Add composite and partial indexes for faster queries

-- ============================================================================
-- 1. BOOKINGS INDEXES
-- ============================================================================

-- Composite index for marketplace queries (status + scheduled_at)
-- Used by: get_market_bookings RPC
CREATE INDEX IF NOT EXISTS idx_bookings_status_scheduled_at 
    ON public.bookings (status, scheduled_at DESC)
    WHERE status = 'requested';

-- Composite index for worker's assigned jobs
-- Used by: Worker App "My Jobs" tab
CREATE INDEX IF NOT EXISTS idx_bookings_worker_status 
    ON public.bookings (worker_id, status)
    WHERE worker_id IS NOT NULL;

-- ============================================================================
-- 2. OTP VERIFICATIONS INDEXES
-- ============================================================================

-- Partial index for active OTP lookups (unverified only)
-- Used by: verify-otp Edge Function
CREATE INDEX IF NOT EXISTS idx_otp_verifications_lookup 
    ON public.otp_verifications (phone, code, expires_at)
    WHERE verified_at IS NULL;

-- ============================================================================
-- 3. WORKERS INDEXES
-- ============================================================================

-- Composite index for worker matching (verified + rating)
-- Used by: match_worker_for_booking RPC
CREATE INDEX IF NOT EXISTS idx_workers_verified_rating 
    ON public.workers_public (is_verified DESC, rating DESC)
    WHERE location IS NOT NULL;

-- ============================================================================
-- 4. CLEANUP FUNCTION
-- ============================================================================

-- Function to clean up expired OTPs (call periodically or via cron)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM public.otp_verifications
    WHERE created_at < NOW() - INTERVAL '24 hours'
    RETURNING COUNT(*) INTO deleted_count;
    
    RETURN deleted_count;
END;
$$;

-- ============================================================================
-- 5. TABLE STATISTICS UPDATE
-- ============================================================================

-- Analyze tables to update query planner statistics
ANALYZE public.bookings;
ANALYZE public.otp_verifications;
ANALYZE public.workers_public;
ANALYZE public.addresses;
ANALYZE public.services;
