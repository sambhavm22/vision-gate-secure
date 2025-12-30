import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@^12.0.0';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2022-11-15',
    httpClient: Stripe.createFetchHttpClient(),
});

// Retry delays in hours: 1, 4, 12, 24
const MAX_RETRIES = 4;

Deno.serve(async (req: Request) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    try {
        // 1. Fetch Failed/Pending Payments needing retry
        // We look for occurrences that are 'failed' with reason 'Payment Failed' OR 
        // We look for Bookings directly? 
        // Design Choice: occurrences track the lifecycle. 
        // If booking created, we track payment on the Booking table (status='requested' -> 'paid'?).
        // Actually, standard system usually pre-auths or charges on creation.
        // Let's assume we want to charge unpaid 'requested' bookings coming from recurring series.

        // Complex query: Bookings that are 'requested', have a recurring_booking parent (via occurrence), 
        // and are not yet paid. 
        // LIMITATION: 'bookings' table doesn't have 'recurring_booking_id'. 
        // We link via 'recurring_booking_occurrences.booking_id'.

        const { data: unpaidOccurrences, error } = await supabase
            .from('recurring_booking_occurrences')
            .select(`
            id,
            retry_count,
            last_retry_at,
            booking:bookings(*),
            recurring_booking:recurring_bookings(stripe_customer_id, stripe_payment_method_id)
        `)
            .eq('status', 'created') // Created means booking exists 
            .not('booking', 'is', null)
            // We need to filter by bookings that are NOT paid? 
            // Or we rely on a separate 'payment_status' column if we had one.
            // For V1, 'status'='requested' implies unpaid. 'paid' implies paid.
            .filter('booking.status', 'eq', 'requested')
            .limit(20);

        if (error) throw error;

        const results = { success: 0, failed: 0, retrying: 0 };

        for (const item of unpaidOccurrences || []) {
            const booking = item.booking;
            const recurring = item.recurring_booking;

            if (!booking || !recurring?.stripe_customer_id || !recurring?.stripe_payment_method_id) {
                // Missing payment info
                console.error(`Missing payment info for occurrence ${item.id}`);
                results.failed++;
                continue;
            }

            // Logic check: Is it time to retry?
            if (item.last_retry_at) {
                const lastRetry = new Date(item.last_retry_at);
                const hoursSince = (Date.now() - lastRetry.getTime()) / (1000 * 60 * 60);
                const delayNeeded = getRetryDelay(item.retry_count);

                if (hoursSince < delayNeeded) {
                    // Not time yet
                    continue;
                }
            }

            try {
                // 2. Charge via Stripe
                const amountCents = Math.round(booking.total_amount * 100);

                const paymentIntent = await stripe.paymentIntents.create({
                    amount: amountCents,
                    currency: 'inr', // Hardcoded for this region
                    customer: recurring.stripe_customer_id,
                    payment_method: recurring.stripe_payment_method_id,
                    off_session: true,
                    confirm: true,
                    metadata: {
                        booking_id: booking.id,
                        recurring_booking_id: recurring.id,
                        occurrence_id: item.id
                    },
                    idempotency_key: `pay_${item.id}_${item.retry_count}`
                });

                if (paymentIntent.status === 'succeeded') {
                    // 3. Success Update
                    await supabase.from('bookings')
                        .update({ status: 'paid' }) // or 'requested' -> 'paid' transition
                        .eq('id', booking.id);

                    // Add transaction record
                    await supabase.from('transactions').insert({
                        booking_id: booking.id,
                        amount: booking.total_amount,
                        payment_method: 'card',
                        status: 'success',
                        provider_transaction_id: paymentIntent.id
                    });

                    results.success++;

                } else {
                    throw new Error(`Stripe status: ${paymentIntent.status}`);
                }

            } catch (err: any) {
                console.error(`Payment failed for ${item.id}:`, err.message);

                // 4. Handle Failure & Retry
                const newCount = (item.retry_count || 0) + 1;

                if (newCount > MAX_RETRIES) {
                    // Permanent Failure
                    await supabase.from('recurring_booking_occurrences')
                        .update({
                            status: 'failed',
                            failure_reason: `Payment failed permanently: ${err.message}`
                        })
                        .eq('id', item.id);
                    // Also cancel booking?
                    await supabase.from('bookings')
                        .update({ status: 'cancelled' })
                        .eq('id', booking.id);

                    results.failed++;
                } else {
                    // Schedule Retry
                    await supabase.from('recurring_booking_occurrences')
                        .update({
                            retry_count: newCount,
                            last_retry_at: new Date().toISOString()
                        })
                        .eq('id', item.id);

                    results.retrying++;
                }
            }
        }

        return new Response(JSON.stringify(results), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
});

function getRetryDelay(retryCount: number): number {
    // 1, 4, 12, 24
    if (retryCount === 0) return 0;
    if (retryCount === 1) return 1;
    if (retryCount === 2) return 4;
    if (retryCount === 3) return 12;
    return 24;
}
