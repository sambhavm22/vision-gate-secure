
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            throw new Error('Unauthorized')
        }

        const url = new URL(req.url)
        // 1. Initiate Verification Flow
        if (url.pathname.endsWith('/initiate')) {
            // Implement Mock or Real URL generation
            const mockUrl = `http://localhost:5173/verification/callback?code=mock_code_123&state=${user.id}`;

            // In a real scenario, this would be the DigiLocker authorized URL
            // const digilockerUrl = `https://digilocker.gov.in/install/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&state=${user.id}`;

            return new Response(
                JSON.stringify({ url: mockUrl, requestId: `req_${Date.now()}` }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 2. Callback Handling (Exchange code for token, get user details)
        if (url.pathname.endsWith('/callback')) {
            const { code, worker_id } = await req.json()

            if (!code) throw new Error('Code is required')

            // MOCK VERIFICATION
            // In real life: Exchange code for access token -> Fetch User Profile from DigiLocker -> Verify DOB/Name matches

            // Simulate processing delay
            // await new Promise(resolve => setTimeout(resolve, 1000));

            // Update Database
            const { error: updateError } = await supabaseClient
                .from('verification_requests')
                .insert({
                    worker_id: worker_id, // We need to be careful if worker_id is passed or derived
                    provider: 'digilocker',
                    status: 'verified', // Directly verified for mock
                    metadata: { mock: true, code }
                })

            if (updateError) throw updateError

            // Update Worker Profile
            const { error: workerError } = await supabaseClient
                .from('workers_public')
                .update({ is_verified: true })
                .eq('id', worker_id)

            if (workerError) throw workerError

            return new Response(
                JSON.stringify({ success: true, status: 'verified' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        return new Response(JSON.stringify({ error: 'Not Found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
