/**
 * Expo Push Notifications hook
 * Registers for push notifications and stores the token in user_devices table
 */

import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
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

interface UseNotificationsReturn {
    expoPushToken: string | null;
    notification: Notifications.Notification | null;
}

export function useNotifications(userId: string | null): UseNotificationsReturn {
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const [notification, setNotification] = useState<Notifications.Notification | null>(null);
    const notificationListener = useRef<Notifications.EventSubscription | null>(null);
    const responseListener = useRef<Notifications.EventSubscription | null>(null);

    useEffect(() => {
        if (!userId) return;

        registerForPushNotifications(userId).then(token => {
            if (token) setExpoPushToken(token);
        });

        // Listen for incoming notifications (foreground)
        notificationListener.current = Notifications.addNotificationReceivedListener(notif => {
            setNotification(notif);
        });

        // Listen for notification taps (background/closed → reopened)
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            // Handle navigation based on notification data
            if (data?.bookingId) {
                // Navigation will be handled by the app
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

    return { expoPushToken, notification };
}

async function registerForPushNotifications(userId: string): Promise<string | null> {
    if (!Device.isDevice) {
        console.log('Push notifications require a physical device');
        return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        Alert.alert('Permission Required', 'Push notifications need permission to work.');
        return null;
    }

    // Android notification channel
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
            // No EAS project configured — push tokens are unavailable in dev
            return null;
        }

        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: projectId as string,
        });
        const token = tokenData.data;

        // Store token in user_devices table
        const { error } = await supabase
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

        if (error) {
            console.error('Error storing push token:', error);
        }

        return token;
    } catch (err) {
        console.error('Error getting push token:', err);
        return null;
    }
}
