/**
 * HelperHub User Mobile App
 * Main app with navigation
 */

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, StatusBar, Text, View } from 'react-native';

import { useUser } from './hooks/useUser';
import {
    BookingScreen,
    DurationSelectionScreen,
    HomeScreen,
    LoginScreen,
    MyBookingsScreen,
    OTPScreen,
    ProfileScreen,
    ScheduleScreen,
    SupportScreen,
    WalletScreen,
} from './screens';

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
};

export type MainTabParamList = {
    Home: undefined;
    MyBookings: undefined;

    Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
    const isDarkMode = true; // Use Dark Mode by default


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
                name="Profile"
                component={ProfileScreen}
                options={{ tabBarIcon: ({ color }) => <Text style={{ color }}>👤</Text> }}
            />
        </Tab.Navigator>
    );
}

function App(): React.JSX.Element {
    const isDarkMode = true; // Use Dark Mode by default
    const { session, loading } = useUser();

    const handleAuthSuccess = () => {
        // Session change handles navigation
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDarkMode ? '#0f172a' : '#fff' }}>
                <ActivityIndicator size="large" color="#10b981" />
            </View>
        );
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
