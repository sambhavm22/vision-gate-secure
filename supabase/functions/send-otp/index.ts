import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { phoneNumber } = await req.json();

        if (!phoneNumber) {
            throw new Error('Phone number is required');
        }

        const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
        const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
        const TWILIO_SERVICE_SID = Deno.env.get('TWILIO_SERVICE_SID');

        if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_SERVICE_SID) {
            throw new Error("Server configuration error: parameters missing");
        }

        // 1. Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        // 2. Store in Database
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { error: dbError } = await supabaseAdmin
            .from('otp_verifications')
            .insert({
                phone: phoneNumber,
                code: otp,
                expires_at: expiry.toISOString(),
            });

        if (dbError) {
            console.error("Database Error:", dbError);
            throw new Error("Failed to store OTP");
        }

        console.log(`Sending OTP ${otp} to ${phoneNumber} via Twilio Messaging Service: ${TWILIO_SERVICE_SID}`);

        // 3. Call Twilio Messaging API
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

        const body = new URLSearchParams();
        body.append('To', phoneNumber);
        body.append('MessagingServiceSid', TWILIO_SERVICE_SID);
        body.append('Body', `Your HelperHub verification code is: ${otp}`);

        const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

        const response = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Twilio Messaging Error:', data);
            throw new Error(data.message || 'Failed to send SMS via Twilio Messaging');
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'OTP sent successfully'
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        );

    } catch (error: any) {
        console.error('Edge Function Error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        );
    }
});
