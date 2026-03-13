/**
 * Push Notifications hook for Worker App.
 * Stores Expo push tokens because the backend sends via Expo Push API.
 */

import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
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
        if (!userId) return;

        registerForPushNotifications(userId);

        notificationListener.current = Notifications.addNotificationReceivedListener((notif) => {
            setNotification(notif);
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

async function registerForPushNotifications(userId: string): Promise<void> {
    try {
        if (!Device.isDevice) {
            console.log('[Push] Not a physical device, skipping registration');
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
            return;
        }

        const projectId =
            Constants?.easConfig?.projectId ??
            (Constants?.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;

        const tokenData = projectId
            ? await Notifications.getExpoPushTokenAsync({ projectId })
            : await Notifications.getExpoPushTokenAsync();

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
        } else {
            console.log('[Push] Device token stored successfully');
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
    } catch (err) {
        console.error('[Push] Registration error:', err);
    }
}
