import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { create, Header, Payload } from "https://deno.land/x/djwt@v2.8/mod.ts";
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
        const { phoneNumber, otp } = await req.json();

        if (!phoneNumber || !otp) {
            throw new Error('Phone number and OTP are required');
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // 1. Verify against Database
        const { data: verifications, error: queryError } = await supabaseAdmin
            .from('otp_verifications')
            .select('*')
            .eq('phone', phoneNumber)
            .eq('code', otp)
            .is('verified_at', null)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1);

        if (queryError || !verifications || verifications.length === 0) {
            console.error("Verification Lookup Failed:", queryError || "No match found");

            // Log attempt (optional improvement: increment match failures specifically)
            throw new Error('Invalid or expired OTP');
        }

        const verification = verifications[0];

        // Mark as verified
        await supabaseAdmin
            .from('otp_verifications')
            .update({ verified_at: new Date().toISOString() })
            .eq('id', verification.id);

        // 2. Success! Proceed with Session Minting

        // Find or Create User - Optimized lookup
        // First try to find existing user by phone using a direct query
        const { data: existingUsers, error: lookupError } = await supabaseAdmin
            .from('auth.users')
            .select('id')
            .eq('phone', phoneNumber)
            .limit(1);

        let userId: string;

        if (lookupError) {
            // Fallback: Try admin API if direct query fails
            const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
                page: 1,
                perPage: 1000
            });
            if (listError) throw listError;
            const existingUser = users.find(u => u.phone === phoneNumber);

            if (existingUser) {
                userId = existingUser.id;
            } else {
                const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                    phone: phoneNumber,
                    phone_confirm: true,
                    user_metadata: { phone_verified: true }
                });
                if (createError) throw createError;
                userId = newUser.user.id;
            }
        } else if (existingUsers && existingUsers.length > 0) {
            userId = existingUsers[0].id;
        } else {
            // Create new user
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                phone: phoneNumber,
                phone_confirm: true,
                user_metadata: { phone_verified: true }
            });
            if (createError) throw createError;
            userId = newUser.user.id;
        }

        // Mint Token
        const jwtSecret = Deno.env.get('SUPABASE_JWT_SECRET') ?? Deno.env.get('JWT_SECRET');
        if (!jwtSecret) throw new Error("Missing JWT Secret");

        const textEncoder = new TextEncoder();
        const keyBuf = textEncoder.encode(jwtSecret);
        const key = await crypto.subtle.importKey(
            'raw',
            keyBuf,
            { name: 'HMAC', hash: 'SHA-256' },
            true,
            ['sign', 'verify']
        );

        const now = Math.floor(Date.now() / 1000);
        const payload: Payload = {
            iss: 'supabase',
            sub: userId,
            aud: 'authenticated',
            exp: now + 3600 * 24 * 7,
            iat: now,
            role: 'authenticated',
        };

        const header: Header = { alg: 'HS256', typ: 'JWT' };
        const accessToken = await create(header, payload, key);

        return new Response(
            JSON.stringify({
                success: true,
                session: {
                    access_token: accessToken,
                    token_type: 'bearer',
                    expires_in: 3600 * 24 * 7,
                    user: { id: userId, phone: phoneNumber }
                }
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        );

    } catch (error: any) {
        console.error('Verify OTP Error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        );
    }
});
