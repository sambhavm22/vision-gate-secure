# Booking creation flow (HelperHub)

Quick walkthrough for how a user creates a booking and how the server validates it.

## Overview
- Client (authenticated user) requests booking creation.
- The app calls RPC `create_booking` which uses `auth.uid()` for `customer_id`.
- RPC validates inputs, calculates `total_amount`, and inserts into `public.bookings` with `status = 'requested'` and `worker_id = NULL`.
- RLS policies ensure users only read/insert their own bookings and cannot spoof other users.

## Step-by-step

1. Client calls `supabase.rpc('create_booking', { ... })` while signed in.
2. RPC reads `auth.uid()` and rejects if not authenticated.
3. RPC validations:
   - `service_id` exists and `is_active = true`.
   - `address_id` exists and `customer_id = auth.uid()` (address ownership).
   - `scheduled_at` is in the future.
   - `duration_minutes` > 0.
4. Pricing: `total_amount = round(services.base_price * (duration_minutes / 60), 2)`.
5. Insert booking row with `status = 'requested'` and `worker_id = NULL`.
6. RPC returns the new booking `id` (uuid) to the client.
7. Client can then navigate to booking confirmation UI or payment flow (if applicable).

## Example payload (RPC)
```json
{
  "service_id_input": 1,
  "address_id_input": "c8f3a9d2-...",
  "scheduled_at_input": "2026-01-10T09:00:00Z",
  "duration_minutes_input": 120,
  "notes_input": "Please bring cleaning supplies"
}
```

## Common error messages and meaning
- "Authentication required": user not signed in.
- "Invalid service_id": service not found or inactive.
- "Invalid address_id or address not owned by user": address missing or belongs to another user.
- "Invalid scheduled_at: must be in the future": scheduled time is past or immediate.
- "Invalid duration_minutes: must be > 0": duration not positive.

## Security notes
- Keep `create_booking` as `SECURITY DEFINER` but enforce `auth.uid()` inside the function.
- Maintain the RLS policies on `public.bookings` to prevent direct client-side tampering.
- Do NOT expose worker-assignment or payment logic in this RPC.

## Files
- RPC/migration: `supabase/migrations/20251214090000_create_bookings_rls_and_create_booking.sql`
- Frontend helper: `src/lib/createBooking.ts`

***
Generated: 2025-12-14
