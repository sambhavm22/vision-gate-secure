/**
 * Expo Push Notifications hook for User App
 * Registers for push notifications and stores the token in user_devices table
 */

import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../services/supabase';

// Configure how notifications appear when app is in foreground
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
    const notificationListener = useRef<any>(null);
    const responseListener = useRef<any>(null);

    useEffect(() => {
        if (!userId) return;

        registerForPushNotifications(userId);

        // Listen for incoming notifications (foreground)
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            // Notification is displayed automatically via the handler above
            console.log('Notification received:', notification.request.content.title);
        });

        // Listen for notification taps
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            if (data?.bookingId) {
                console.log('Notification tapped, bookingId:', data.bookingId);
            }
        });

        return () => {
            if (notificationListener.current) {
                notificationListener.current.remove();
            }
            if (responseListener.current) {
                responseListener.current.remove();
            }
        };
    }, [userId]);
}

async function registerForPushNotifications(userId: string): Promise<void> {
    if (!Device.isDevice) {
        return; // Silent return on simulators for user app
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        return; // Don't alert, just silently skip
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#10b981',
        });
    }

    try {
        // A valid EAS projectId is required to fetch an Expo push token.
        // In Expo Go / local dev without EAS configured, skip silently.
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        if (!projectId) {
            return;
        }

        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId,
        });
        const token = tokenData.data;

        await supabase
            .from('user_devices')
            .upsert({
                user_id: userId,
                platform: Platform.OS,
                os: Platform.OS,
                device_token: token,
                last_active: new Date().toISOString(),
            }, {
                onConflict: 'user_id,platform',
            });
    } catch (err) {
        console.error('Error registering push token:', err);
    }
}
