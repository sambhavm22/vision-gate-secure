/**
 * Push Notifications hook for User App
 * Uses expo-notifications with getDevicePushTokenAsync() to get native FCM/APNs tokens.
 * These native tokens are sent directly to FCM via the push-notifications edge function.
 * Works with Expo Go, Expo Dev Client, and production builds.
 */

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
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

export function useNotifications(userId: string | null): void {
    const notificationListener = useRef<Notifications.EventSubscription | null>(null);
    const responseListener = useRef<Notifications.EventSubscription | null>(null);

    useEffect(() => {
        if (!userId) {
            console.log('[Push] No userId, skipping');
            return;
        }

        console.log('[Push] Registering for user:', userId);
        registerForPushNotifications(userId);

        // Foreground notification listener
        notificationListener.current = Notifications.addNotificationReceivedListener((notif) => {
            Alert.alert(
                notif.request.content.title ?? 'Notification',
                notif.request.content.body ?? '',
            );
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
}

/**
 * Register for push notifications using native device tokens (FCM on Android, APNs on iOS).
 */
async function registerForPushNotifications(userId: string): Promise<void> {
    try {
        if (!Device.isDevice) {
            console.log('[Push] Not a physical device, skipping');
            Alert.alert('[Push Debug]', 'Not a physical device — skipping token registration');
            return;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('[Push] Permission not granted');
            Alert.alert('[Push Debug]', `Permission status: ${finalStatus} — not granted`);
            return;
        }

        console.log('[Push] Permission granted, getting device token...');

        // Get NATIVE device push token (FCM on Android, APNs on iOS)
        const tokenData = await Notifications.getDevicePushTokenAsync();
        const deviceToken =
            typeof tokenData.data === 'string' ? tokenData.data : JSON.stringify(tokenData.data);

        console.log(`[Push] Native device token (${tokenData.type}):`, deviceToken);

        // Store in user_devices table
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
            Alert.alert('[Push Debug]', `DB upsert error: ${error.message}`);
        } else {
            console.log('[Push] Device token stored successfully');
            Alert.alert('[Push Debug]', `✅ Token stored!\nType: ${tokenData.type}\nToken: ${deviceToken.substring(0, 20)}...`);
        }

        // Android notification channel
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#6366f1',
                sound: 'default',
            });
        }
    } catch (err: any) {
        console.error('[Push] Registration error:', err);
        Alert.alert(
            '[Push Debug] Registration Failed',
            `Error: ${err?.message ?? String(err)}`,
        );
    }
}
