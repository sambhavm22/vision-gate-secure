-- Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'support', 'operations')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for admin_users
CREATE POLICY "Admins can view admin_users" ON public.admin_users
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Super admins can manage admin_users" ON public.admin_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Update RLS for profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (public.is_admin());

-- Update RLS for bookings
CREATE POLICY "Admins can view all bookings" ON public.bookings
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all bookings" ON public.bookings
    FOR UPDATE USING (public.is_admin());

-- Update RLS for workers_public
CREATE POLICY "Admins can view all workers" ON public.workers_public
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all workers" ON public.workers_public
    FOR UPDATE USING (public.is_admin());

-- Audit logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.admin_users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add status to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'blocked'));

-- Enable RLS for audit logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" ON public.admin_audit_logs
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert audit logs" ON public.admin_audit_logs
    FOR INSERT WITH CHECK (public.is_admin());
