-- 1. ENUM for recurring booking status
DO $$ BEGIN
    CREATE TYPE public.recurring_booking_status AS ENUM (
        'active', 'paused', 'cancelled', 'completed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. ENUM for occurrence status
DO $$ BEGIN
    CREATE TYPE public.occurrence_status AS ENUM (
        'pending', 'scheduled', 'created', 'skipped', 'failed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. recurring_bookings table
CREATE TABLE IF NOT EXISTS public.recurring_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    service_ids BIGINT[] NOT NULL,  -- Array for multi-service support
    address_id UUID NOT NULL REFERENCES public.addresses(id),
    preferred_worker_id UUID REFERENCES public.workers_public(id),
    
    -- RRULE Configuration (RFC 5545)
    rrule TEXT NOT NULL,  -- e.g., "FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=12"
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    start_date DATE NOT NULL,
    end_date DATE,  -- NULL = no end date
    max_occurrences INTEGER,  -- NULL = unlimited (with end_date)
    
    -- Scheduling
    preferred_time_start TIME NOT NULL,  -- e.g., 09:00
    preferred_time_end TIME NOT NULL,    -- e.g., 11:00
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    
    -- Pricing (snapshot at creation)
    price_snapshot JSONB NOT NULL,  -- {service_id: price, ...}
    total_per_occurrence NUMERIC(10,2) NOT NULL,
    
    -- Status
    status public.recurring_booking_status DEFAULT 'active',
    
    -- Stripe
    stripe_customer_id TEXT,
    stripe_payment_method_id TEXT,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_time_window CHECK (preferred_time_start < preferred_time_end),
    CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date > start_date)
);

-- 4. recurring_booking_occurrences table
CREATE TABLE IF NOT EXISTS public.recurring_booking_occurrences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recurring_booking_id UUID NOT NULL REFERENCES public.recurring_bookings(id) ON DELETE CASCADE,
    
    -- Occurrence Details
    occurrence_index INTEGER NOT NULL,  -- 1, 2, 3, ... for ordering
    scheduled_for TIMESTAMPTZ NOT NULL,
    
    -- Materialization
    booking_id UUID REFERENCES public.bookings(id),
    worker_id UUID REFERENCES public.workers_public(id),
    
    -- Status
    status public.occurrence_status DEFAULT 'pending',
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    last_retry_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- UNIQUE constraint for idempotency
    CONSTRAINT unique_occurrence UNIQUE (recurring_booking_id, occurrence_index)
);

-- 5. worker_recurring_preferences table
CREATE TABLE IF NOT EXISTS public.worker_recurring_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES public.workers_public(id) ON DELETE CASCADE,
    recurring_booking_id UUID NOT NULL REFERENCES public.recurring_bookings(id) ON DELETE CASCADE,
    
    -- Preferences
    accepts_series BOOLEAN DEFAULT false,  -- Worker accepts all occurrences
    blocked_dates DATE[],  -- Specific dates worker is unavailable
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    CONSTRAINT unique_worker_recurring UNIQUE (worker_id, recurring_booking_id)
);

-- 6. recurring_booking_audit_log table
CREATE TABLE IF NOT EXISTS public.recurring_booking_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recurring_booking_id UUID NOT NULL REFERENCES public.recurring_bookings(id),
    occurrence_id UUID REFERENCES public.recurring_booking_occurrences(id),
    
    action TEXT NOT NULL,  -- 'created', 'paused', 'resumed', 'cancelled', 'occurrence_generated', 'booking_created', 'payment_failed', etc.
    old_state JSONB,
    new_state JSONB,
    metadata JSONB,
    
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recurring_bookings_user ON public.recurring_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_bookings_status ON public.recurring_bookings(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_recurring_bookings_worker ON public.recurring_bookings(preferred_worker_id) WHERE preferred_worker_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_occurrences_recurring ON public.recurring_booking_occurrences(recurring_booking_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_status ON public.recurring_booking_occurrences(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_occurrences_scheduled ON public.recurring_booking_occurrences(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_occurrences_pending_scheduled ON public.recurring_booking_occurrences(scheduled_for) 
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_worker_recurring_prefs ON public.worker_recurring_preferences(worker_id);
CREATE INDEX IF NOT EXISTS idx_audit_recurring ON public.recurring_booking_audit_log(recurring_booking_id);
