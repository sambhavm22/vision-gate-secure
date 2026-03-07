/**
 * Push Notifications hook for Worker App
 * Uses expo-notifications with getDevicePushTokenAsync() to get native FCM/APNs tokens.
 * These native tokens are sent directly to FCM via the push-notifications edge function.
 * Works with Expo Go, Expo Dev Client, and production builds.
 */

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../services/supabase';

// Configure how notifications appear when the app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

interface UseNotificationsReturn {
    notification: Notifications.Notification | null;
}

export function useNotifications(userId: string | null): UseNotificationsReturn {
    const [notification, setNotification] = useState<Notifications.Notification | null>(null);
    const notificationListener = useRef<Notifications.EventSubscription | null>(null);
    const responseListener = useRef<Notifications.EventSubscription | null>(null);

    useEffect(() => {
        if (!userId) return;

        // Register for push notifications and store the device token
        registerForPushNotifications(userId);

        // Foreground notification listener
        notificationListener.current = Notifications.addNotificationReceivedListener((notif) => {
            setNotification(notif);
        });

        // Notification response listener (user taps on notification)
        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
            const data = response.notification.request.content.data;
            console.log('[Push] Notification tapped, data:', data);
        });

        return () => {
            notificationListener.current?.remove();
            responseListener.current?.remove();
        };
    }, [userId]);

    return { notification };
}

/**
 * Register for push notifications using native device tokens (FCM on Android, APNs on iOS).
 * These are NOT Expo push tokens — they are the raw platform tokens that FCM can deliver to.
 */
async function registerForPushNotifications(userId: string): Promise<void> {
    try {
        // Check if running on a physical device (push doesn't work on simulators)
        if (!Device.isDevice) {
            console.log('[Push] Not a physical device, skipping registration');
            return;
        }

        // Request notification permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('[Push] Permission not granted');
            return;
        }

        // Get NATIVE device push token (FCM token on Android, APNs token on iOS)
        // This is different from getExpoPushTokenAsync() — it returns the raw platform token
        const tokenData = await Notifications.getDevicePushTokenAsync();
        const deviceToken = tokenData.data;

        console.log(`[Push] Native device token (${tokenData.type}):`, deviceToken);

        // Store the token in user_devices table
        const { error } = await supabase
            .from('user_devices')
            .upsert(
                {
                    user_id: userId,
                    platform: Platform.OS,
                    device_token: deviceToken,
                    last_seen_at: new Date().toISOString(),
                },
                {
                    onConflict: 'user_id,platform',
                },
            );

        if (error) {
            console.error('[Push] Error storing device token:', error);
        } else {
            console.log('[Push] Device token stored successfully');
        }

        // Set up Android notification channel
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#10b981',
                sound: 'default',
            });
        }
    } catch (err) {
        console.error('[Push] Registration error:', err);
    }
}
