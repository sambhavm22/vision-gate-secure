/**
 * HelperHub User Mobile App
 * Main app with navigation
 */

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar, Text, View } from 'react-native';

import { useNotifications } from './hooks/useNotifications';
import { useUser } from './hooks/useUser';
import {
    BookingDetailsScreen,
    BookingScreen,
    DisputeDetailScreen,
    DurationSelectionScreen,
    HomeScreen,
    LiveTrackingScreen,
    LoginScreen,
    MyBookingsScreen,
    MyDisputesScreen,
    NotificationsScreen,
    OTPScreen,
    ProfileScreen,
    RaiseDisputeScreen,
    ReminderSettingsScreen,
    SavedAddressScreen,
    ScheduleScreen,
    SplashScreen,
    SupportScreen,
    WalletScreen,
    YourExpertsScreen,
} from './screens';
import { supabase } from './services/supabase';

// Navigation type definitions
export type RootStackParamList = {
    Login: undefined;
    OTP: { contact: string; method: 'phone' | 'email' };
    MainTabs: { screen?: keyof MainTabParamList };
    Booking: {
        serviceId: string;
        serviceName: string;
        bookingType: 'now' | 'prebook';
        duration?: number;
        price?: number;
        date?: string;
        time?: string;
    };
    Schedule: {
        serviceId: string;
        serviceName: string;
    };
    DurationSelection: {
        serviceId: string;
        serviceName: string;
    };
    Support: undefined;
    Wallet: undefined;
    YourExperts: undefined;
    SavedAddress: undefined;
    BookingDetails: {
        bookingId: string;
        serviceName: string;
        status: string;
        scheduledAt: string;
        durationMinutes: number | null;
        totalAmount: number | null;
        address: string | null;
        workerName: string | null;
        paymentMethod: string | null;
    };
    RaiseDispute: {
        bookingId: string;
        serviceName: string;
        workerId?: string;
    };
    MyDisputes: undefined;
    DisputeDetail: {
        disputeId: string;
    };
    ReminderSettings: undefined;
    LiveTracking: { bookingId: string };
};

export type MainTabParamList = {
    Home: undefined;
    MyBookings: undefined;
    Notifications: undefined;
    Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
    const isDarkMode = true;
    const { user } = useUser();
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnread = useCallback(async () => {
        if (!user?.id) return;
        const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false);
        setUnreadCount(count || 0);
    }, [user?.id]);

    useEffect(() => { fetchUnread(); }, [fetchUnread]);

    useEffect(() => {
        if (!user?.id) return;
        const channel = supabase
            .channel('user-badge-count')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => fetchUnread())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [user?.id, fetchUnread]);

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                    borderTopColor: isDarkMode ? '#334155' : '#e2e8f0',
                },
                tabBarActiveTintColor: '#10b981',
                tabBarInactiveTintColor: '#94a3b8',
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{ tabBarIcon: ({ color }) => <Text style={{ color }}>🏠</Text> }}
            />
            <Tab.Screen
                name="MyBookings"
                component={MyBookingsScreen}
                options={{
                    title: 'Bookings',
                    tabBarIcon: ({ color }) => <Text style={{ color }}>📅</Text>
                }}
            />
            <Tab.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{
                    title: 'Alerts',
                    tabBarIcon: ({ color }) => (
                        <View>
                            <Text style={{ color }}>🔔</Text>
                            {unreadCount > 0 && (
                                <View style={{ position: 'absolute', top: -4, right: -10, backgroundColor: '#ef4444', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                                </View>
                            )}
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ tabBarIcon: ({ color }) => <Text style={{ color }}>👤</Text> }}
            />
        </Tab.Navigator>
    );
}

function App(): React.JSX.Element {
    const { user, session, loading } = useUser();
    const isDarkMode = true; // Use Dark Mode by default

    // Register for push notifications silently (no UI change)
    useNotifications(user?.id ?? null);

    const handleAuthSuccess = () => {
        // Session change handles navigation
    };

    if (loading) {
        return <SplashScreen />;
    }

    return (
        <NavigationContainer>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                }}
            >
                {session ? (
                    <>
                        <Stack.Screen name="MainTabs" component={MainTabs} />
                        <Stack.Screen
                            name="Booking"
                            component={BookingScreen}
                            options={{ headerShown: true, title: 'Book Service', headerBackTitle: 'Back' }}
                        />
                        <Stack.Screen
                            name="Schedule"
                            component={ScheduleScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="DurationSelection"
                            component={DurationSelectionScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Support"
                            component={SupportScreen}
                            options={{ headerShown: true, title: 'Help & Support', headerBackTitle: 'Back', headerStyle: { backgroundColor: '#1e293b' }, headerTintColor: '#fff' }}
                        />
                        <Stack.Screen
                            name="Wallet"
                            component={WalletScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="YourExperts"
                            component={YourExpertsScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="SavedAddress"
                            component={SavedAddressScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="BookingDetails"
                            component={BookingDetailsScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="RaiseDispute"
                            component={RaiseDisputeScreen}
                            options={{ headerShown: true, title: 'Report Issue', headerStyle: { backgroundColor: '#1e293b' }, headerTintColor: '#fff' }}
                        />
                        <Stack.Screen
                            name="MyDisputes"
                            component={MyDisputesScreen}
                            options={{ headerShown: true, title: 'My Disputes', headerStyle: { backgroundColor: '#1e293b' }, headerTintColor: '#fff' }}
                        />
                        <Stack.Screen
                            name="DisputeDetail"
                            component={DisputeDetailScreen}
                            options={{ headerShown: true, title: 'Dispute Details', headerStyle: { backgroundColor: '#1e293b' }, headerTintColor: '#fff' }}
                        />
                        <Stack.Screen
                            name="ReminderSettings"
                            component={ReminderSettingsScreen}
                            options={{ headerShown: true, title: 'Reminder Settings', headerStyle: { backgroundColor: '#1e293b' }, headerTintColor: '#fff' }}
                        />
                        <Stack.Screen
                            name="LiveTracking"
                            component={LiveTrackingScreen}
                            options={{ headerShown: false }} // custom header
                        />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="OTP">
                            {props => <OTPScreen {...props} onAuthSuccess={handleAuthSuccess} />}
                        </Stack.Screen>
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default App;
