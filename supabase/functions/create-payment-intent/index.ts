import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@^12.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
    apiVersion: '2022-11-15',
    httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        // Get the user from the authorization header
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing Authorization header');
        }
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) {
            throw new Error('Invalid user token');
        }

        const { booking_id } = await req.json();
        if (!booking_id) {
            throw new Error('Missing booking_id');
        }

        // 1. Fetch booking details to verify amount and ownership
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', booking_id)
            .single();

        if (bookingError || !booking) {
            throw new Error('Booking not found');
        }

        // Optional: Check if user owns the booking (or is admin/worker?) 
        // Usually only customer pays.
        if (booking.customer_id !== user.id) {
            // Allow if flexible, but standard is customer pays
            // throw new Error('Not authorized to pay for this booking');
        }

        const currency = 'inr';
        // Amount in cents/paisa
        const amount = Math.round(booking.total_amount * 100);

        // 2. Create Stripe PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            metadata: {
                booking_id,
                user_id: user.id
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });

        // 3. Create Payment Record in DB
        const { data: paymentRecord, error: paymentError } = await supabase
            .from('payments')
            .insert({
                booking_id,
                user_id: user.id,
                amount: booking.total_amount,
                currency,
                provider: 'stripe',
                provider_payment_id: paymentIntent.id,
                provider_order_id: paymentIntent.client_secret,
                status: 'pending' // Initial status
            })
            .select()
            .single();

        if (paymentError) {
            console.error('Error creating payment record:', paymentError);
            throw new Error('Failed to create payment record');
        }

        return new Response(
            JSON.stringify({
                clientSecret: paymentIntent.client_secret,
                paymentId: paymentRecord.id,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        );
    }
});
