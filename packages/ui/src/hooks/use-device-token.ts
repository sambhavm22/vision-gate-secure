import { supabase } from "@vision-gate/supabase/client";
import { useEffect } from 'react';

export function useDeviceToken(userId: string | undefined) {
    useEffect(() => {
        if (!userId) return;

        const registerDevice = async () => {
            // In a real app, this would come from FCM, Expo, or Service Worker
            // For this implementation, we use a mock token to represent the device
            const mockToken = `web_${userId.substring(0, 8)}_${navigator.userAgent.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10)}`;
            const platform = 'web';

            console.log("Registering device token:", mockToken);

            const { error } = await supabase
                .from('user_devices')
                .upsert({
                    user_id: userId,
                    device_token: mockToken,
                    platform: platform,
                    last_seen_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id, device_token'
                });

            if (error) {
                console.error("Error registering device token:", error);
            } else {
                console.log("Device token registered successfully");
            }
        };

        registerDevice();
    }, [userId]);
}
