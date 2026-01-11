import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@^12.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
    apiVersion: '2022-11-15',
    httpClient: Stripe.createFetchHttpClient(),
});

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

Deno.serve(async (req) => {
    try {
        const signature = req.headers.get('stripe-signature');
        if (!signature || !endpointSecret) {
            throw new Error('Missing stripe signature or webhook secret');
        }

        const body = await req.text();
        let event;

        try {
            event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
        } catch (err: any) {
            console.error(`Webhook signature verification failed: ${err.message}`);
            return new Response(`Webhook Error: ${err.message}`, { status: 400 });
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        // Handle the event
        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const { booking_id } = paymentIntent.metadata;

            console.log(`Payment succeeded for booking: ${booking_id}`);

            // 1. Update Payment Record
            await supabase
                .from('payments')
                .update({ status: 'success', updated_at: new Date().toISOString() })
                .eq('provider_payment_id', paymentIntent.id);

            // 2. Update Booking Status -> 'paid'
            if (booking_id) {
                const { error } = await supabase
                    .from('bookings')
                    .update({ status: 'paid', updated_at: new Date().toISOString() })
                    .eq('id', booking_id);

                if (error) console.error('Error updating booking status:', error);
            }

        } else if (event.type === 'payment_intent.payment_failed') {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            console.log(`Payment failed: ${paymentIntent.id}`);

            // Update Payment Record
            await supabase
                .from('payments')
                .update({ status: 'failed', updated_at: new Date().toISOString() })
                .eq('provider_payment_id', paymentIntent.id);
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error(error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { 'Content-Type': 'application/json' },
                status: 400,
            }
        );
    }
});
