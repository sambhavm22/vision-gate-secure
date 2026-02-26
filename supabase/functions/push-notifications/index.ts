import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
    const { user_id, title, body, data } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Sending notification to user ${user_id}: ${title} - ${body}`);

    // 1. Fetch Expo push tokens for the user
    const { data: devices, error: fetchError } = await supabase
        .from('user_devices')
        .select('device_token, platform')
        .eq('user_id', user_id);

    if (fetchError) {
        console.error('Error fetching device tokens:', fetchError);
        return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 });
    }

    if (!devices || devices.length === 0) {
        console.log(`No device tokens found for user ${user_id}`);
        return new Response(JSON.stringify({ success: true, message: 'No devices found' }), { status: 200 });
    }

    // 2. Filter valid Expo push tokens
    const expoPushTokens = devices
        .map(d => d.device_token)
        .filter(token => token && (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[')));

    if (expoPushTokens.length === 0) {
        console.log(`No valid Expo push tokens for user ${user_id}`);
        return new Response(JSON.stringify({ success: true, message: 'No valid Expo tokens' }), { status: 200 });
    }

    // 3. Build Expo push messages
    const messages = expoPushTokens.map(token => ({
        to: token,
        sound: 'default',
        title: title,
        body: body,
        data: data || {},
        priority: 'high',
    }));

    // 4. Send via Expo Push API
    try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messages),
        });

        const result = await response.json();
        console.log('Expo Push API response:', JSON.stringify(result));

        // Handle ticket errors (invalid tokens)
        if (result.data) {
            for (const ticket of result.data) {
                if (ticket.status === 'error') {
                    console.error(`Push error for token: ${ticket.message}`);
                    // If token is invalid, remove from database
                    if (ticket.details?.error === 'DeviceNotRegistered') {
                        const badToken = messages.find((_m, i) => result.data[i] === ticket)?.to;
                        if (badToken) {
                            await supabase
                                .from('user_devices')
                                .delete()
                                .eq('device_token', badToken);
                            console.log(`Removed invalid token: ${badToken}`);
                        }
                    }
                }
            }
        }

        return new Response(JSON.stringify({ success: true, results: result }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (pushError) {
        console.error('Expo Push API error:', pushError);
        return new Response(JSON.stringify({ error: 'Failed to send push notification' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
