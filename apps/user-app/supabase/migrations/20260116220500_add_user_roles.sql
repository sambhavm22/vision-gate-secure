-- Add 'super_admin' to app_role enum. 
-- Splitting into separate file to avoid "unsafe use of new value" error in same transaction.
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'super_admin';
