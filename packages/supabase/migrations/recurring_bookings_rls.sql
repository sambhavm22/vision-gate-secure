-- Enable RLS
ALTER TABLE public.recurring_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_booking_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_recurring_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_booking_audit_log ENABLE ROW LEVEL SECURITY;

-- ===== RECURRING_BOOKINGS =====
-- Users can view their own recurring bookings
CREATE POLICY "Users view own recurring bookings"
    ON public.recurring_bookings FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own recurring bookings
CREATE POLICY "Users create own recurring bookings"
    ON public.recurring_bookings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own recurring bookings (pause/resume/cancel)
CREATE POLICY "Users update own recurring bookings"
    ON public.recurring_bookings FOR UPDATE
    USING (auth.uid() = user_id);

-- Workers can view recurring bookings they're assigned to
CREATE POLICY "Workers view assigned recurring bookings"
    ON public.recurring_bookings FOR SELECT
    USING (auth.uid() = preferred_worker_id);

-- Service role bypass (for background jobs)
CREATE POLICY "Service role full access recurring bookings"
    ON public.recurring_bookings TO service_role
    USING (true) WITH CHECK (true);

-- ===== RECURRING_BOOKING_OCCURRENCES =====
-- Users can view occurrences of their recurring bookings
CREATE POLICY "Users view own occurrences"
    ON public.recurring_booking_occurrences FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.recurring_bookings rb
        WHERE rb.id = recurring_booking_id AND rb.user_id = auth.uid()
    ));

-- Workers can view occurrences assigned to them
CREATE POLICY "Workers view assigned occurrences"
    ON public.recurring_booking_occurrences FOR SELECT
    USING (worker_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.recurring_bookings rb
        WHERE rb.id = recurring_booking_id AND rb.preferred_worker_id = auth.uid()
    ));

-- Users can update (skip) their own occurrences
CREATE POLICY "Users skip own occurrences"
    ON public.recurring_booking_occurrences FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.recurring_bookings rb
        WHERE rb.id = recurring_booking_id AND rb.user_id = auth.uid()
    ));

-- Service role bypass
CREATE POLICY "Service role full access occurrences"
    ON public.recurring_booking_occurrences TO service_role
    USING (true) WITH CHECK (true);

-- ===== WORKER_RECURRING_PREFERENCES =====
-- Workers can view and manage their preferences
CREATE POLICY "Workers manage own preferences"
    ON public.worker_recurring_preferences
    FOR ALL USING (auth.uid() = worker_id);

-- Service role bypass
CREATE POLICY "Service role full access worker prefs"
    ON public.worker_recurring_preferences TO service_role
    USING (true) WITH CHECK (true);

-- ===== AUDIT_LOG =====
-- Users can view their audit logs
CREATE POLICY "Users view own audit logs"
    ON public.recurring_booking_audit_log FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.recurring_bookings rb
        WHERE rb.id = recurring_booking_id AND rb.user_id = auth.uid()
    ));

-- Service role full access
CREATE POLICY "Service role full access audit log"
    ON public.recurring_booking_audit_log TO service_role
    USING (true) WITH CHECK (true);
