-- Migration: Secure Schema (Privilege Escalation & Audit Log Hardening)
-- Prevent users from updating their own 'role' field to 'admin'
-- Ensure RLS on admin_audit_logs is strictly enforced

-- 1. Function to check role changes
CREATE OR REPLACE FUNCTION public.check_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $function$
BEGIN
  -- If role is changing in any way
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Check if the actor is TRULY an admin by querying the DB, not just trusting the session role if vulnerable
    -- public.is_admin() checks the profiles table.
    -- If the user DOES NOT have admin role currently, they cannot change role.
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Unauthorized: Only admins can change user roles.';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- 2. Trigger on profiles
DROP TRIGGER IF EXISTS tr_protect_role_change ON public.profiles;
CREATE TRIGGER tr_protect_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_role_change();


-- 3. Hardening admin_audit_logs RLS
-- Ensure ONLY admins can insert.
-- Dropping existing policy just in case it was loose
DROP POLICY IF EXISTS "Admins create audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins create audit logs"
    ON public.admin_audit_logs
    FOR INSERT
    WITH CHECK (public.is_admin());

-- Ensure ONLY admins can view.
DROP POLICY IF EXISTS "Admins view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins view audit logs"
    ON public.admin_audit_logs
    FOR SELECT
    USING (public.is_admin());

-- 4. Enable RLS explicitly (idempotent)
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
