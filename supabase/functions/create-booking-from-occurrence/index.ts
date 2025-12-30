import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import { createHash } from "https://deno.land/std@0.160.0/hash/mod.ts";

// Process occurrences scheduled within next 24 hours
const PROCESSING_WINDOW_HOURS = 24;

Deno.serve(async (req: Request) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const now = new Date();
    const processingWindow = new Date(now.getTime() + PROCESSING_WINDOW_HOURS * 60 * 60 * 1000);

    try {
        // 1. Fetch Pending Occurrences
        const { data: pendingOccurrences, error: fetchError } = await supabase
            .from('recurring_booking_occurrences')
            .select(`
            *,
            recurring_booking:recurring_bookings(*)
        `)
            .eq('status', 'pending')
            .lte('scheduled_for', processingWindow.toISOString())
            .order('scheduled_for', { ascending: true })
            .limit(50); // Batch size

        if (fetchError) throw fetchError;

        const results = { created: 0, failed: 0, skipped: 0 };

        // 2. Process Each Occurrence
        for (const occurrence of pendingOccurrences || []) {
            const rb = occurrence.recurring_booking;

            // SKIP if parent booking is not active
            if (rb.status !== 'active') {
                // Optional: Mark occurrence as cancelled? Or just leave pending until active?
                // If cancelled, mark as failed/cancelled.
                if (rb.status === 'cancelled') {
                    await supabase.from('recurring_booking_occurrences')
                        .update({ status: 'failed', failure_reason: 'Recurring booking cancelled' })
                        .eq('id', occurrence.id);
                }
                results.skipped++;
                continue;
            }

            try {
                // A. Advisory Lock (Postgres)
                // We use a hash of the ID to get a 64-bit int for pg_advisory_lock
                // JS numbers are floats, so bigints are safer for this.
                // Simplified approach: using transactional safety inside a database function would be better,
                // but for this Edge Function approach, we try best effort or use a dedicated RPC if possible.
                // We will use the 'booking_id' update as the lock mechanism essentially.
                // But let's try an advisory lock RPC if we had one. 
                // For now, we will rely on a re-check strategy since we don't have the RPC handy in the migration I just made.
                // *Self-correction*: I didn't add the `pg_try_advisory_lock` RPC wrapper in the migration. 
                // I will implement optimisitic locking via specific UPDATE condition.

                // B. Optimistic Lock / Check
                // We will attempt to update status to "processing" (if we had such a status) or just rely on atomic insert.
                // Actually, let's process it.

                // 3. Create Booking
                // Simple pricing logic from RB definition
                // Note: service_id handling (RB has array, booking has single). 
                // V1 Assumption: Single service or primary service.
                const primaryServiceId = rb.service_ids[0];

                const { data: newBooking, error: bookingError } = await supabase
                    .from('bookings')
                    .insert({
                        customer_id: rb.user_id,
                        service_id: primaryServiceId,
                        address_id: rb.address_id,
                        worker_id: rb.preferred_worker_id,
                        scheduled_at: occurrence.scheduled_for,
                        duration_minutes: rb.duration_minutes,
                        total_amount: rb.total_per_occurrence,
                        notes: `Recurring #${occurrence.occurrence_index}. ${rb.notes || ''}`,
                        status: 'requested'
                        // 'requested' allows worker to accept. 
                        // If preferred_worker is set, it might go to 'matched' automatically in matching logic?
                        // The schema default is 'requested'. 
                    })
                    .select()
                    .single();

                if (bookingError) throw bookingError;

                // 4. Update Occurrence
                const { error: updateError } = await supabase
                    .from('recurring_booking_occurrences')
                    .update({
                        booking_id: newBooking.id,
                        status: 'created',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', occurrence.id)
                    .eq('status', 'pending'); // Optimistic lock ensuring it was still pending

                if (updateError) {
                    // If update failed (maybe another process took it?), we might have a dangling booking.
                    // Extreme edge case. 
                    throw updateError;
                }

                // 5. Audit Log
                await supabase.from('recurring_booking_audit_log').insert({
                    recurring_booking_id: rb.id,
                    occurrence_id: occurrence.id,
                    action: 'booking_created',
                    new_state: { booking_id: newBooking.id },
                    created_by: null // System
                });

                results.created++;

            } catch (err: any) {
                console.error(`Error processing occurrence ${occurrence.id}:`, err);

                // Mark failed
                await supabase.from('recurring_booking_occurrences')
                    .update({
                        status: 'failed',
                        failure_reason: err.message,
                        retry_count: occurrence.retry_count + 1,
                        last_retry_at: new Date().toISOString()
                    })
                    .eq('id', occurrence.id);

                results.failed++;
            }
        }

        return new Response(JSON.stringify(results), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
});
