/**
 * HelperHub Worker Mobile App
 * Main app with navigation
 */

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, Text, View } from 'react-native';

import { useNotifications } from './hooks/useNotifications';
import { useUser } from './hooks/useUser';
import {
    DashboardScreen,
    DisputeDetailScreen,
    EarningsScreen,
    LoginScreen,
    MyDisputesScreen,
    MyJobsScreen,
    NotificationsScreen,
    OTPScreen,
    ProfileScreen,
    RaiseDisputeScreen,
} from './screens';
import { supabase } from './services/supabase';

// Navigation type definitions
export type RootStackParamList = {
    Login: undefined;
    OTP: { contact: string; method: 'phone' | 'email' };
    MainTabs: { screen?: keyof MainTabParamList };
    RaiseDispute: {
        bookingId: string;
        serviceName: string;
        customerId?: string;
    };
    MyDisputes: undefined;
    DisputeDetail: {
        disputeId: string;
    };
};

export type MainTabParamList = {
    Dashboard: undefined;
    Calendar: undefined;
    MyJobs: undefined;
    Earnings: undefined;
    Notifications: undefined;
    Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
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
            .channel('worker-badge-count')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => fetchUnread())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [user?.id, fetchUnread]);

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#1e293b',
                    borderTopColor: '#334155',
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 4,
                },
                tabBarActiveTintColor: '#10b981',
                tabBarInactiveTintColor: '#94a3b8',
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                },
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }: { color: string }) => <Text style={{ color, fontSize: 20 }}>🏠</Text>,
                }}
            />
            <Tab.Screen
                name="MyJobs"
                component={MyJobsScreen}
                options={{
                    title: 'My Jobs',
                    tabBarIcon: ({ color }: { color: string }) => <Text style={{ color, fontSize: 20 }}>📋</Text>,
                }}
            />
            <Tab.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{
                    title: 'Alerts',
                    tabBarIcon: ({ color }: { color: string }) => (
                        <View>
                            <Text style={{ color, fontSize: 20 }}>🔔</Text>
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
                name="Earnings"
                component={EarningsScreen}
                options={{
                    title: 'Earnings',
                    tabBarIcon: ({ color }: { color: string }) => <Text style={{ color, fontSize: 20 }}>💰</Text>,
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color }: { color: string }) => <Text style={{ color, fontSize: 20 }}>👤</Text>,
                }}
            />
        </Tab.Navigator>
    );
}

function SplashScreen() {
    return (
        <View style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🔧</Text>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#f8fafc', marginBottom: 8 }}>
                HelperHub Worker
            </Text>
            <ActivityIndicator size="large" color="#10b981" />
        </View>
    );
}

function App(): React.JSX.Element {
    const { session, user, loading } = useUser();

    // Register for push notifications as soon as the user is logged in
    useNotifications(user?.id ?? null);

    if (loading) {
        return <SplashScreen />;
    }

    return (
        <NavigationContainer>
            <StatusBar barStyle="light-content" />
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
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="OTP">
                            {(props: any) => <OTPScreen {...props} onAuthSuccess={() => { }} />}
                        </Stack.Screen>
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default App;
