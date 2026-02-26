/**
 * HelperHub Worker Mobile App
 * Main app with navigation
 */

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, StatusBar, Text, View } from 'react-native';

import { useUser } from './hooks/useUser';
import {
    CalendarScreen,
    DashboardScreen,
    EarningsScreen,
    LoginScreen,
    MyJobsScreen,
    OTPScreen,
    ProfileScreen,
} from './screens';

// Navigation type definitions
export type RootStackParamList = {
    Login: undefined;
    OTP: { contact: string; method: 'phone' | 'email' };
    MainTabs: { screen?: keyof MainTabParamList };
};

export type MainTabParamList = {
    Dashboard: undefined;
    Calendar: undefined;
    MyJobs: undefined;
    Earnings: undefined;
    Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
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
                name="Calendar"
                component={CalendarScreen}
                options={{
                    title: 'Schedule',
                    tabBarIcon: ({ color }: { color: string }) => <Text style={{ color, fontSize: 20 }}>📅</Text>,
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
    const { session, loading } = useUser();

    const handleAuthSuccess = () => {
        // Session change will auto-navigate
    };

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
                    <Stack.Screen name="MainTabs" component={MainTabs} />
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="OTP">
                            {(props: any) => <OTPScreen {...props} onAuthSuccess={handleAuthSuccess} />}
                        </Stack.Screen>
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default App;
