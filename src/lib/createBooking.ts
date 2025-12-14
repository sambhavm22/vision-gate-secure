import { supabase } from '@/integrations/supabase/client';

export type CreateBookingParams = {
  serviceId: number;
  addressId: string;
  scheduledAtIso: string; // ISO string in UTC
  durationMinutes: number;
  notes?: string | null;
};

export const examplePayload = {
  service_id_input: 1,
  address_id_input: 'c8f3a9d2-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  scheduled_at_input: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
  duration_minutes_input: 120,
  notes_input: 'Please bring your own tools.'
};

/**
 * Create a booking via the secure RPC `create_booking`.
 * Throws Error with a friendly message on failure.
 */
export async function createBooking(params: CreateBookingParams): Promise<string> {
  const payload = {
    service_id_input: params.serviceId,
    address_id_input: params.addressId,
    scheduled_at_input: params.scheduledAtIso,
    duration_minutes_input: params.durationMinutes,
    notes_input: params.notes ?? null,
  } as const;

  const { data, error } = await supabase.rpc('create_booking', payload);

  if (error) {
    const msg = (error.message || '').toLowerCase();

    if (msg.includes('authentication required')) {
      throw new Error('You must be signed in to create a booking.');
    }
    if (msg.includes('invalid duration_minutes')) {
      throw new Error('Duration must be greater than 0 minutes.');
    }
    if (msg.includes('invalid scheduled_at')) {
      throw new Error('Please select a future date/time for the booking.');
    }
    if (msg.includes('invalid service_id')) {
      throw new Error('Selected service is not available.');
    }
    if (msg.includes('address not owned') || msg.includes('invalid address_id')) {
      throw new Error('Selected address was not found or does not belong to you.');
    }

    // Generic fallback
    throw new Error(error.message || 'Failed to create booking');
  }

  // Supabase RPC returns scalar in `data` (the new booking id)
  return data as string;
}

export default createBooking;
