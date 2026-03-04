import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { RootStackParamList } from '../App';
import { supabase } from '../services/supabase';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props): React.JSX.Element {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOTP = async () => {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length < 10) {
            Alert.alert('Invalid Number', 'Please enter a valid phone number.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                phone: `+91${cleaned}`,
            });

            if (error) throw error;

            navigation.navigate('OTP', { contact: `+91${cleaned}`, method: 'phone' });
        } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const redirectUrl = makeRedirectUri({
                native: 'worker-mobile://login-callback',
            });

            console.log('\n--- SUPABASE OAUTH CONFIG ---');
            console.log('Add this exact URL to your Supabase Auth Redirect URIs list:');
            console.log(redirectUrl);
            console.log('-----------------------------\n');

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    queryParams: {
                        prompt: 'select_account',
                    },
                    skipBrowserRedirect: true,
                },
            });
            if (error) throw error;

            if (data.url) {
                const result = await WebBrowser.openAuthSessionAsync(
                    data.url,
                    redirectUrl,
                );

                if (result.type === 'success' && result.url) {
                    const url = result.url;
                    if (url.includes('access_token') && url.includes('refresh_token')) {
                        const hashIndex = url.indexOf('#');
                        if (hashIndex !== -1) {
                            const fragment = url.substring(hashIndex + 1);
                            const params = new URLSearchParams(fragment);
                            const access_token = params.get('access_token');
                            const refresh_token = params.get('refresh_token');

                            if (access_token && refresh_token) {
                                const { error: sessionError } = await supabase.auth.setSession({
                                    access_token,
                                    refresh_token,
                                });
                                if (sessionError) throw sessionError;
                            }
                        }
                    }
                }
            }
        } catch (err) {
            Alert.alert('Google Login Error', err instanceof Error ? err.message : 'Failed');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.inner}
            >
                <View style={styles.headerSection}>
                    <Text style={styles.appIcon}>🔧</Text>
                    <Text style={styles.title}>HelperHub Worker</Text>
                    <Text style={styles.subtitle}>Login to manage your bookings and jobs</Text>
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.label}>Phone Number</Text>
                    <View style={styles.phoneInputRow}>
                        <View style={styles.countryCode}>
                            <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                        </View>
                        <TextInput
                            style={styles.phoneInput}
                            placeholder="Enter your phone number"
                            placeholderTextColor="#64748b"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            maxLength={10}
                            autoFocus
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.sendButton, loading && styles.disabledButton]}
                        onPress={handleSendOTP}
                        disabled={loading}
                        activeOpacity={0.7}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.sendButtonText}>Send OTP</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <TouchableOpacity
                        style={styles.googleButton}
                        onPress={handleGoogleLogin}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.googleButtonText}>G  Continue with Google</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.footerText}>
                    By continuing, you agree to our Terms of Service
                </Text>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    inner: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 48,
    },
    appIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#f8fafc',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#94a3b8',
        textAlign: 'center',
    },
    formSection: {
        marginBottom: 48,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#cbd5e1',
        marginBottom: 10,
    },
    phoneInputRow: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 10,
    },
    countryCode: {
        backgroundColor: '#1e293b',
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 10,
        paddingHorizontal: 14,
        justifyContent: 'center',
        height: 52,
    },
    countryCodeText: {
        fontSize: 16,
        color: '#f8fafc',
    },
    phoneInput: {
        flex: 1,
        backgroundColor: '#1e293b',
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 10,
        paddingHorizontal: 16,
        fontSize: 18,
        color: '#f8fafc',
        height: 52,
        letterSpacing: 1,
    },
    sendButton: {
        backgroundColor: '#10b981',
        borderRadius: 10,
        paddingVertical: 16,
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.7,
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#334155',
    },
    dividerText: {
        color: '#64748b',
        marginHorizontal: 16,
        fontSize: 14,
        fontWeight: '600',
    },
    googleButton: {
        backgroundColor: '#10b981',
        borderRadius: 10,
        paddingVertical: 16,
        alignItems: 'center',
    },
    googleButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footerText: {
        fontSize: 12,
        color: '#64748b',
        textAlign: 'center',
    },
});
