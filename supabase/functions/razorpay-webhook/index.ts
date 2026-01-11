import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import Razorpay from 'npm:razorpay@2.9.2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const signature = req.headers.get('x-razorpay-signature');
        const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');

        if (!signature || !webhookSecret) {
            console.error('Missing signature or secret');
            return new Response('Missing signature or secret', { status: 400 });
        }

        const body = await req.text();

        // 1. Verify Signature
        try {
            const isValid = Razorpay.validateWebhookSignature(body, signature, webhookSecret);
            if (!isValid) {
                throw new Error('Invalid signature');
            }
        } catch (err: any) {
            console.error(`Signature verification failed: ${err.message}`);
            return new Response('Invalid Signature', { status: 400 });
        }

        const event = JSON.parse(body);
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        console.log(`Received event: ${event.event}`);

        // 2. Handle 'order.paid'
        if (event.event === 'order.paid') {
            const order = event.payload.order.entity;
            const payment = event.payload.payment.entity; // The first payment associated with success

            console.log(`Order Paid: ${order.id}, Payment ID: ${payment.id}`);

            // Update Payments Table
            const { data: paymentRecord, error: fetchError } = await supabase
                .from('payments')
                .select('*')
                .eq('provider_order_id', order.id)
                .single();

            if (fetchError || !paymentRecord) {
                console.error('Payment record not found for order:', order.id);
                // Return 200 to acknowledge webhook even if our DB is desync'd to avoid heavy retries?
                // Better to throw 400/500 if we want retry, but here we log error.
                return new Response(JSON.stringify({ received: true, error: 'Record not found' }), { status: 200 });
            }

            // Update status
            const { error: updateError } = await supabase
                .from('payments')
                .update({
                    status: 'success',
                    provider_payment_id: payment.id, // Capture actual payment ID
                    updated_at: new Date().toISOString()
                })
                .eq('id', paymentRecord.id);

            if (updateError) console.error('Error updating payment:', updateError);

            // Update Booking Status
            if (paymentRecord.booking_id) {
                const { error: bookingError } = await supabase
                    .from('bookings')
                    .update({ status: 'paid', updated_at: new Date().toISOString() })
                    .eq('id', paymentRecord.booking_id);

                if (bookingError) console.error('Error updating booking:', bookingError);
            }

        } else if (event.event === 'payment.failed') {
            // Handle failures if linked to order
            const payment = event.payload.payment.entity;
            if (payment.order_id) {
                await supabase
                    .from('payments')
                    .update({ status: 'failed', updated_at: new Date().toISOString() })
                    .eq('provider_order_id', payment.order_id);
            }
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
                status: 500,
            }
        );
    }
});
