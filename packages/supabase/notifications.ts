import { supabase } from "./client";

export async function registerFcmToken(userId: string, token: string, deviceType: 'ios' | 'android' | 'web' = 'web') {
    if (!userId || !token) return;

    console.log(`Registering FCM token for user ${userId}`);

    const { error } = await (supabase
        .from('fcm_tokens') as any)
        .upsert({
            user_id: userId,
            token: token,
            device_type: deviceType,
            updated_at: new Date().toISOString(),
        }, {
            onConflict: 'token'
        });

    if (error) {
        console.error("Error registering FCM token:", error);
        throw error;
    }

    console.log("FCM token registered successfully");
}
