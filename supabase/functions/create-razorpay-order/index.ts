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
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        // 1. Auth Check
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (userError || !user) throw new Error('Invalid user token');

        const { booking_id } = await req.json();
        if (!booking_id) throw new Error('Missing booking_id');

        // 2. Fetch Booking
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', booking_id)
            .single();

        if (bookingError || !booking) throw new Error('Booking not found');

        // 3. Initialize Razorpay
        const key_id = Deno.env.get('RAZORPAY_KEY_ID');
        const key_secret = Deno.env.get('RAZORPAY_KEY_SECRET');

        if (!key_id || !key_secret) {
            console.error('Razorpay keys missing');
            throw new Error('Server configuration error: Razorpay keys not set');
        }

        const instance = new Razorpay({
            key_id: key_id,
            key_secret: key_secret,
        });

        // 4. Create Order
        const amount = Math.round(booking.total_amount * 100); // INR in paisa
        const currency = 'INR';

        const options = {
            amount: amount,
            currency: currency,
            receipt: `booking_${booking_id.substring(0, 20)}`,
            notes: {
                booking_id: booking_id,
                user_id: user.id
            }
        };

        const order = await instance.orders.create(options);

        if (!order || !order.id) {
            throw new Error('Failed to create Razorpay order');
        }

        // 5. Record in DB
        const { error: paymentError } = await supabase
            .from('payments')
            .insert({
                booking_id,
                user_id: user.id,
                amount: booking.total_amount,
                currency: 'inr',
                provider: 'razorpay',
                provider_order_id: order.id,
                status: 'created' // pending frontend capture
            });

        if (paymentError) {
            console.error('DB Insert Error:', paymentError);
            throw new Error('Failed to record payment');
        }

        return new Response(
            JSON.stringify({
                success: true,
                order_id: order.id,
                amount: order.amount,
                currency: order.currency,
                key_id: key_id // Frontend needs this to open checkout
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );

    } catch (error: any) {
        console.error('Error:', error.message);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        );
    }
});
