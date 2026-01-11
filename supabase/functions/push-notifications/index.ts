import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
    const { user_id, title, body, data } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Sending notification to user ${user_id}: ${title} - ${body}`);

    // 1. Fetch tokens for the user
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

    // 2. Send push to each device (Placeholder for FCM/Expo/WebPush)
    const notifications = devices.map(async (device) => {
        console.log(`[PUSH] To user: ${user_id}, Platform: ${device.platform}, Token: ${device.device_token}`);

        // TODO: Implement actual FCM or Expo Push here
        /*
        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `key=${Deno.env.get('FCM_SERVER_KEY')}`
            },
            body: JSON.stringify({
                to: device.device_token,
                notification: { title, body },
                data: data
            })
        });
        */

        return { token: device.device_token, status: 'sent_mock' };
    });

    const results = await Promise.all(notifications);

    return new Response(JSON.stringify({ success: true, results }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
    });
});
