/**
 * Login Screen
 * Phone/Email input with OTP request
 * MOCKED: No real backend integration
 */

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';

type LoginScreenProps = {
    navigation: NativeStackNavigationProp<any>;
};

type LoginMethod = 'phone' | 'email';

export function LoginScreen({ navigation }: LoginScreenProps): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';

    const [loginMethod, setLoginMethod] = useState<LoginMethod>('phone');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Frontend-only validation
    const isValidPhone = (phone: string) => {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 10;
    };

    const isValidEmail = (emailInput: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(emailInput);
    };

    const isFormValid = loginMethod === 'phone'
        ? isValidPhone(phoneNumber)
        : isValidEmail(email);

    const handleSendOTP = async () => {
        setError('');

        // Frontend validation
        if (loginMethod === 'phone' && !isValidPhone(phoneNumber)) {
            setError('Please enter a valid phone number');
            return;
        }
        if (loginMethod === 'email' && !isValidEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);

        // MOCK: Simulate API call delay
        // TODO: Replace with real Supabase auth call
        await new Promise(resolve => setTimeout(resolve, 1500));

        setLoading(false);

        // Navigate to OTP screen with contact info
        navigation.navigate('OTP', {
            contact: loginMethod === 'phone' ? phoneNumber : email,
            method: loginMethod,
        });
    };

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.content}>
                    {/* Header */}
                    <Text style={[styles.title, isDarkMode && styles.darkText]}>
                        Welcome to HelperHub
                    </Text>
                    <Text style={[styles.subtitle, isDarkMode && styles.darkTextMuted]}>
                        Sign in to continue
                    </Text>

                    {/* Login Method Toggle */}
                    <View style={styles.toggleContainer}>
                        <TouchableOpacity
                            style={[
                                styles.toggleButton,
                                loginMethod === 'phone' && styles.toggleButtonActive,
                            ]}
                            onPress={() => {
                                setLoginMethod('phone');
                                setError('');
                            }}
                        >
                            <Text style={[
                                styles.toggleText,
                                loginMethod === 'phone' && styles.toggleTextActive,
                            ]}>
                                Phone
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.toggleButton,
                                loginMethod === 'email' && styles.toggleButtonActive,
                            ]}
                            onPress={() => {
                                setLoginMethod('email');
                                setError('');
                            }}
                        >
                            <Text style={[
                                styles.toggleText,
                                loginMethod === 'email' && styles.toggleTextActive,
                            ]}>
                                Email
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Input Field */}
                    {loginMethod === 'phone' ? (
                        <View style={styles.inputContainer}>
                            <Text style={[styles.inputLabel, isDarkMode && styles.darkTextMuted]}>
                                Phone Number
                            </Text>
                            <TextInput
                                style={[styles.input, isDarkMode && styles.darkInput]}
                                placeholder="+1 (555) 123-4567"
                                placeholderTextColor="#999"
                                keyboardType="phone-pad"
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                autoFocus
                            />
                        </View>
                    ) : (
                        <View style={styles.inputContainer}>
                            <Text style={[styles.inputLabel, isDarkMode && styles.darkTextMuted]}>
                                Email Address
                            </Text>
                            <TextInput
                                style={[styles.input, isDarkMode && styles.darkInput]}
                                placeholder="you@example.com"
                                placeholderTextColor="#999"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                value={email}
                                onChangeText={setEmail}
                                autoFocus
                            />
                        </View>
                    )}

                    {/* Error Message */}
                    {error ? (
                        <Text style={styles.errorText}>{error}</Text>
                    ) : null}

                    {/* Send OTP Button */}
                    <TouchableOpacity
                        style={[
                            styles.button,
                            (!isFormValid || loading) && styles.buttonDisabled,
                        ]}
                        onPress={handleSendOTP}
                        disabled={!isFormValid || loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Send OTP</Text>
                        )}
                    </TouchableOpacity>

                    {/* Mock Notice */}
                    <Text style={[styles.mockNotice, isDarkMode && styles.darkTextMuted]}>
                        🔧 Demo Mode: OTP will be sent (mocked)
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    darkContainer: {
        backgroundColor: '#1a1a1a',
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1a1a1a',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
        marginBottom: 32,
    },
    darkText: {
        color: '#ffffff',
    },
    darkTextMuted: {
        color: '#999999',
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
        padding: 4,
        marginBottom: 24,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    toggleButtonActive: {
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666666',
    },
    toggleTextActive: {
        color: '#1a1a1a',
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666666',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 16,
        color: '#1a1a1a',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    darkInput: {
        backgroundColor: '#2a2a2a',
        borderColor: '#3a3a3a',
        color: '#ffffff',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 14,
        marginBottom: 16,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        backgroundColor: '#93c5fd',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    mockNotice: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        marginTop: 24,
    },
});
