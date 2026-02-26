-- Harden RLS policies by explicitly binding them to the 'authenticated' role
-- rather than the implicit 'public' role (which includes 'anon').
-- We intentionally leave a few read-only policies (e.g. for services and reviews) as public.

-- ==========================================
-- PUBLIC SCHEMA POLICIES
-- ==========================================

-- export_logs
ALTER POLICY "View export logs" ON export_logs TO authenticated;

-- user_devices
ALTER POLICY "Users can manage own devices" ON user_devices TO authenticated;

-- addresses
ALTER POLICY "Users can delete own addresses" ON addresses TO authenticated;
ALTER POLICY "Users can insert own addresses" ON addresses TO authenticated;
ALTER POLICY "Users can update own addresses" ON addresses TO authenticated;
ALTER POLICY "Users can view own addresses" ON addresses TO authenticated;

-- transactions
ALTER POLICY "Users see own transactions" ON transactions TO authenticated;

-- recurring_bookings
ALTER POLICY "Users create own recurring bookings" ON recurring_bookings TO authenticated;
ALTER POLICY "Users update own recurring bookings" ON recurring_bookings TO authenticated;
ALTER POLICY "View recurring bookings" ON recurring_bookings TO authenticated;

-- notifications
ALTER POLICY "Users update own notifications" ON notifications TO authenticated;
ALTER POLICY "Users view own notifications" ON notifications TO authenticated;

-- recurring_booking_occurrences
ALTER POLICY "Users skip own occurrences" ON recurring_booking_occurrences TO authenticated;
ALTER POLICY "View occurrences" ON recurring_booking_occurrences TO authenticated;

-- worker_recurring_preferences
ALTER POLICY "Workers manage own preferences" ON worker_recurring_preferences TO authenticated;

-- customer_preferred_workers
ALTER POLICY "Users manage preferred workers" ON customer_preferred_workers TO authenticated;

-- recurring_booking_audit_log
ALTER POLICY "Users view own audit logs" ON recurring_booking_audit_log TO authenticated;

-- worker_availability_blocks
ALTER POLICY "Workers manage own blocks" ON worker_availability_blocks TO authenticated;

-- fcm_tokens
ALTER POLICY "Users can manage their own tokens" ON fcm_tokens TO authenticated;

-- profiles
ALTER POLICY "Update profiles" ON profiles TO authenticated;
ALTER POLICY "Users can insert own profile" ON profiles TO authenticated;

-- payments
ALTER POLICY "Users can view their own payments" ON payments TO authenticated;

-- workers_public
ALTER POLICY "Update workers" ON workers_public TO authenticated;
ALTER POLICY "Users can insert own worker profile" ON workers_public TO authenticated;

-- support_tickets
ALTER POLICY "Insert support tickets" ON support_tickets TO authenticated;
ALTER POLICY "Update support tickets" ON support_tickets TO authenticated;
ALTER POLICY "View support tickets" ON support_tickets TO authenticated;

-- bookings
ALTER POLICY "Update bookings" ON bookings TO authenticated;
ALTER POLICY "Users create bookings" ON bookings TO authenticated;
ALTER POLICY "View bookings" ON bookings TO authenticated;

-- admin_users
ALTER POLICY "Admins can view admin users" ON admin_users TO authenticated;
ALTER POLICY "Super admins delete admin_users" ON admin_users TO authenticated;
ALTER POLICY "Super admins modify admin_users" ON admin_users TO authenticated;
ALTER POLICY "Super admins update admin_users" ON admin_users TO authenticated;

-- admin_audit_logs
ALTER POLICY "Admins create audit logs" ON admin_audit_logs TO authenticated;
ALTER POLICY "Admins view audit logs" ON admin_audit_logs TO authenticated;

-- reviews
ALTER POLICY "Customers can create reviews" ON reviews TO authenticated;

-- ==========================================
-- STORAGE SCHEMA POLICIES
-- ==========================================

ALTER POLICY "Users can read own export files" ON storage.objects TO authenticated;
ALTER POLICY "Users can upload their own attachments" ON storage.objects TO authenticated;
ALTER POLICY "Users can view their own attachments" ON storage.objects TO authenticated;


