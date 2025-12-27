-- Create a table to store OTP verifications
CREATE TABLE IF NOT EXISTS public.otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    verified_at TIMESTAMPTZ,
    attempts INTEGER DEFAULT 0
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS otp_verifications_phone_idx ON public.otp_verifications (phone);

-- RLS: Only the service role should be able to manage this table
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can do everything" ON public.otp_verifications
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
