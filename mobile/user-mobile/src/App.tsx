/**
 * HelperHub User Mobile App
 * Main app with navigation
 */

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { StatusBar, useColorScheme } from 'react-native';

import { HomeScreen, LoginScreen, OTPScreen } from './screens';

// Navigation type definitions
export type RootStackParamList = {
    Login: undefined;
    OTP: { contact: string; method: 'phone' | 'email' };
    Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';

    // MOCK: Local auth state
    // TODO: Replace with real Supabase auth state
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const handleAuthSuccess = () => {
        // MOCK: Set authenticated state
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        // MOCK: Clear authenticated state
        // TODO: Replace with real Supabase signOut
        setIsAuthenticated(false);
    };

    return (
        <NavigationContainer>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                }}
            >
                {isAuthenticated ? (
                    // Authenticated screens
                    <Stack.Screen name="Home">
                        {props => <HomeScreen {...props} onLogout={handleLogout} />}
                    </Stack.Screen>
                ) : (
                    // Auth screens
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
