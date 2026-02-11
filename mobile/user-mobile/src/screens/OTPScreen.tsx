/**
 * OTP Verification Screen
 * 6-digit OTP input with verification
 */

import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../services/supabase';

type OTPScreenProps = {
    navigation: NativeStackNavigationProp<any>;
    route: RouteProp<{ OTP: { contact: string; method: 'phone' | 'email' } }, 'OTP'>;
    onAuthSuccess: () => void;
};

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

export function OTPScreen({ navigation, route, onAuthSuccess }: OTPScreenProps): React.JSX.Element {
    const { contact, method } = route.params;

    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);

    const inputRefs = useRef<(TextInput | null)[]>([]);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const otpString = otp.join('');
    const isOtpComplete = otpString.length === OTP_LENGTH;

    const handleOtpChange = (value: string, index: number) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setError('');

        // Auto-focus next input
        if (value && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (key: string, index: number) => {
        // Handle backspace - move to previous input
        if (key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        if (!isOtpComplete) return;

        setLoading(true);
        setError('');

        try {
            const verifyParams = method === 'phone'
                ? { phone: contact, token: otpString, type: 'sms' as const }
                : { email: contact, token: otpString, type: 'email' as const };

            const { data, error: verifyError } = await supabase.auth.verifyOtp(verifyParams);

            if (verifyError) throw verifyError;

            if (data.session) {
                setSuccess(true);
                // Wait a moment to show success state
                setTimeout(() => {
                    onAuthSuccess();
                }, 500);
            } else {
                setError('Verification failed. Please try again.');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid OTP');
            // Clear OTP on error
            setOtp(Array(OTP_LENGTH).fill(''));
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (resendCooldown > 0) return;

        setLoading(true);
        setError('');

        try {
            const { error: resendError } = await supabase.auth.signInWithOtp(
                method === 'phone'
                    ? { phone: contact }
                    : { email: contact }
            );

            if (resendError) throw resendError;

            setResendCooldown(RESEND_COOLDOWN);
            setOtp(Array(OTP_LENGTH).fill(''));
            inputRefs.current[0]?.focus();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    const maskedContact = method === 'phone'
        ? `****${contact.slice(-4)}`
        : contact.replace(/(.{2})(.*)(@.*)/, '$1***$3');

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Back Button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>
                        ← Back
                    </Text>
                </TouchableOpacity>

                {/* Header */}
                <Text style={styles.title}>
                    Verify OTP
                </Text>
                <Text style={styles.subtitle}>
                    Enter the 6-digit code sent to{'\n'}
                    <Text style={styles.contactText}>{maskedContact}</Text>
                </Text>

                {/* OTP Input Boxes */}
                <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={ref => { inputRefs.current[index] = ref; }}
                            style={[
                                styles.otpInput,
                                digit ? styles.otpInputFilled : null,
                                error ? styles.otpInputError : null,
                                success ? styles.otpInputSuccess : null,
                            ]}
                            value={digit}
                            onChangeText={value => handleOtpChange(value, index)}
                            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                            keyboardType="number-pad"
                            placeholderTextColor="#64748b"
                            cursorColor="#10b981"
                            maxLength={1}
                            selectTextOnFocus
                            autoFocus={index === 0}
                        />
                    ))}
                </View>

                {/* Error Message */}
                {error ? (
                    <Text style={styles.errorText}>{error}</Text>
                ) : null}

                {/* Success Message */}
                {success ? (
                    <Text style={styles.successText}>✓ OTP Verified Successfully!</Text>
                ) : null}

                {/* Verify Button */}
                <TouchableOpacity
                    style={[
                        styles.button,
                        (!isOtpComplete || loading || success) && styles.buttonDisabled,
                        success && styles.buttonSuccess,
                    ]}
                    onPress={handleVerify}
                    disabled={!isOtpComplete || loading || success}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : success ? (
                        <Text style={styles.buttonText}>✓ Verified</Text>
                    ) : (
                        <Text style={styles.buttonText}>Verify OTP</Text>
                    )}
                </TouchableOpacity>

                {/* Resend OTP */}
                <View style={styles.resendContainer}>
                    <Text style={styles.resendText}>
                        Didn't receive the code?{' '}
                    </Text>
                    <TouchableOpacity
                        onPress={handleResendOTP}
                        disabled={resendCooldown > 0}
                    >
                        <Text style={[
                            styles.resendLink,
                            resendCooldown > 0 && styles.resendLinkDisabled,
                        ]}>
                            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                        </Text>
                    </TouchableOpacity>
                </View>

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a', // Dark slate to match Login
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    backButton: {
        alignSelf: 'flex-start',
        paddingVertical: 8,
        marginBottom: 24,
    },
    backButtonText: {
        fontSize: 16,
        color: '#94a3b8',
        fontWeight: '500',
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
        lineHeight: 24,
    },
    contactText: {
        fontWeight: '600',
        color: '#f8fafc',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 24,
    },
    otpInput: {
        width: 48,
        height: 56,
        borderRadius: 12,
        backgroundColor: '#1e293b',
        borderWidth: 2,
        borderColor: '#334155',
        fontSize: 24,
        fontWeight: '600',
        textAlign: 'center',
        color: '#f8fafc',
    },
    otpInputFilled: {
        borderColor: '#10b981', // Emerald 500
    },
    otpInputError: {
        borderColor: '#ef4444',
        backgroundColor: '#450a0a',
    },
    otpInputSuccess: {
        borderColor: '#22c55e',
        backgroundColor: '#064e3b',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 14,
        marginBottom: 16,
        textAlign: 'center',
    },
    successText: {
        color: '#22c55e',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#10b981',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#065f46', // Darker emerald
        opacity: 0.7,
    },
    buttonSuccess: {
        backgroundColor: '#22c55e',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    resendText: {
        fontSize: 14,
        color: '#94a3b8',
    },
    resendLink: {
        fontSize: 14,
        color: '#10b981',
        fontWeight: '600',
    },
    resendLinkDisabled: {
        color: '#64748b',
    },
});
