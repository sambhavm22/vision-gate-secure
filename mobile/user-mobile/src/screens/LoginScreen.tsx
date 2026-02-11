/**
 * Login Screen
 * Redesigned to match HelperHub Dark Theme
 */

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Linking,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../services/supabase';

type LoginScreenProps = {
    navigation: NativeStackNavigationProp<any>;
};

type LoginMethod = 'email' | 'phone';
type AuthMode = 'signIn' | 'signUp';

export function LoginScreen({ navigation }: LoginScreenProps): React.JSX.Element {
    const [method, setMethod] = useState<LoginMethod>('email');
    const [authMode, setAuthMode] = useState<AuthMode>('signIn');

    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleEmailAuth = async () => {
        setLoading(true);
        setError('');
        try {
            if (authMode === 'signIn') {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                Alert.alert('Check your email', 'We sent you a confirmation link.');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const handlePhoneAuth = async () => {
        setLoading(true);
        setError('');
        try {
            const { error } = await supabase.auth.signInWithOtp({
                phone,
            });
            if (error) throw error;

            navigation.navigate('OTP', {
                contact: phone,
                method: 'phone',
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = async (provider: 'google' | 'facebook') => {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: 'user-mobile://login-callback',
                    queryParams: {
                        prompt: 'select_account',
                    },
                },
            });
            if (error) throw error;
            if (data.url) {
                await Linking.openURL(data.url);
            }
        } catch (err) {
            Alert.alert('Social Login Error', err instanceof Error ? err.message : 'Failed');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    {/* Logo Area */}
                    <View style={styles.logoContainer}>
                        <View style={styles.logoBox}>
                            <Text style={styles.logoText}>HH</Text>
                        </View>
                    </View>

                    <Text style={styles.title}>Welcome to HelperHub</Text>
                    <Text style={styles.subtitle}>
                        {authMode === 'signIn' ? 'Sign in to access your account' : 'Create a new account'}
                    </Text>

                    {/* Tabs */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, method === 'email' && styles.activeTab]}
                            onPress={() => setMethod('email')}
                        >
                            <Text style={[styles.tabText, method === 'email' && styles.activeTabText]}>Email</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, method === 'phone' && styles.activeTab]}
                            onPress={() => setMethod('phone')}
                        >
                            <Text style={[styles.tabText, method === 'phone' && styles.activeTabText]}>Mobile OTP</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Form Content */}
                    <View style={styles.formContainer}>
                        {method === 'email' ? (
                            <>
                                <Text style={styles.label}>Email</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="your@email.com"
                                    placeholderTextColor="#64748b"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />

                                <Text style={styles.label}>Password</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="#64748b"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />

                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={handleEmailAuth}
                                    disabled={loading}
                                >
                                    {loading ? <ActivityIndicator color="#fff" /> : (
                                        <Text style={styles.primaryButtonText}>
                                            {authMode === 'signIn' ? 'Sign In' : 'Sign Up'}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <Text style={styles.label}>Mobile Number</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="+1 234 567 8900"
                                    placeholderTextColor="#64748b"
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                />
                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={handlePhoneAuth}
                                    disabled={loading}
                                >
                                    {loading ? <ActivityIndicator color="#fff" /> : (
                                        <Text style={styles.primaryButtonText}>Send OTP</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        {/* Social Login Section */}
                        <View style={styles.dividerContainer}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <View style={styles.socialContainer}>
                            <TouchableOpacity
                                style={[styles.socialButton, { backgroundColor: '#10b981' }]}
                                onPress={() => handleSocialLogin('google')}
                            >
                                <Text style={styles.socialButtonText}>G  Google</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.socialButton, { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' }]}
                                onPress={() => handleSocialLogin('facebook')}
                            >
                                <Text style={styles.socialButtonText}>f  Facebook</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Toggle Mode */}
                        <TouchableOpacity
                            style={styles.footerLink}
                            onPress={() => setAuthMode(mode => mode === 'signIn' ? 'signUp' : 'signIn')}
                        >
                            <Text style={styles.footerText}>
                                {authMode === 'signIn' ? "Don't have an account? " : "Already have an account? "}
                                <Text style={styles.linkText}>
                                    {authMode === 'signIn' ? 'Sign up' : 'Sign in'}
                                </Text>
                            </Text>
                        </TouchableOpacity>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a', // Dark slate background
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logoBox: {
        width: 80,
        height: 80,
        backgroundColor: '#fff',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#10b981',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#f8fafc',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#94a3b8',
        textAlign: 'center',
        marginBottom: 32,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 4,
        marginBottom: 24,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: '#0f172a',
    },
    tabText: {
        color: '#64748b',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#f8fafc',
    },
    formContainer: {
        gap: 16,
    },
    label: {
        color: '#f8fafc',
        fontWeight: '600',
        marginBottom: -8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 16,
        color: '#f8fafc',
        borderWidth: 1,
        borderColor: '#334155',
    },
    primaryButton: {
        backgroundColor: '#10b981', // Emerald 500
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    errorText: {
        color: '#ef4444',
        textAlign: 'center',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#334155',
    },
    dividerText: {
        color: '#64748b',
        marginHorizontal: 16,
        fontSize: 12,
        fontWeight: '600',
    },
    socialContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    socialButton: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    socialButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    footerLink: {
        marginTop: 24,
        alignItems: 'center',
    },
    footerText: {
        color: '#94a3b8',
    },
    linkText: {
        color: '#10b981',
        fontWeight: 'bold',
    },
});
