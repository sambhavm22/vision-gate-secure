/**
 * Push Notifications hook for Worker App.
 * Stores Expo push tokens because the backend sends via Expo Push API.
 */

import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { supabase } from '../services/supabase';

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
        if (!userId) {
            console.log('[Push] No userId, skipping notification registration');
            return;
        }

        console.log('[Push] Registering for user:', userId);

        registerForPushNotifications(userId);

        notificationListener.current = Notifications.addNotificationReceivedListener((notif) => {
            setNotification(notif);
            // Show visible alert for foreground notifications
            Alert.alert(
                notif.request.content.title ?? 'Notification',
                notif.request.content.body ?? '',
            );
        });

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

        // Get EXPO push token
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;

        if (!projectId) {
            console.error('[Push] EAS Project ID not found in app config!');
            Alert.alert('[Push Debug]', 'EAS Project ID is missing from app.config.js');
            return;
        }

        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId,
        });

        const deviceToken = typeof tokenData.data === 'string' ? tokenData.data : JSON.stringify(tokenData.data);

        console.log('[Push] Expo push token:', tokenData.data);

        const { error } = await supabase
            .from('user_devices')
            .upsert(
                {
                    user_id: userId,
                    platform: Platform.OS,
                    device_token: tokenData.data,
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

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#10b981',
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
