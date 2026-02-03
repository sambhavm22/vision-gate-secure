/**
 * OTP Verification Screen
 * 6-digit OTP input with verification
 * MOCKED: Accepts 123456 as valid OTP
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
    useColorScheme,
} from 'react-native';

type OTPScreenProps = {
    navigation: NativeStackNavigationProp<any>;
    route: RouteProp<{ OTP: { contact: string; method: 'phone' | 'email' } }, 'OTP'>;
    onAuthSuccess: () => void;
};

const OTP_LENGTH = 6;
// MOCK: This is the valid OTP for testing
const MOCK_VALID_OTP = '123456';
const RESEND_COOLDOWN = 30;

export function OTPScreen({ navigation, route, onAuthSuccess }: OTPScreenProps): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
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

        // MOCK: Simulate API verification delay
        // TODO: Replace with real Supabase OTP verification
        await new Promise(resolve => setTimeout(resolve, 1000));

        setLoading(false);

        // MOCK: Check against dummy OTP
        if (otpString === MOCK_VALID_OTP) {
            setSuccess(true);
            // Wait a moment to show success state
            setTimeout(() => {
                onAuthSuccess();
            }, 500);
        } else {
            setError(`Invalid OTP. Hint: Try ${MOCK_VALID_OTP}`);
            // Clear OTP on error
            setOtp(Array(OTP_LENGTH).fill(''));
            inputRefs.current[0]?.focus();
        }
    };

    const handleResendOTP = async () => {
        if (resendCooldown > 0) return;

        // MOCK: Simulate resend delay
        // TODO: Replace with real Supabase resend call
        setResendCooldown(RESEND_COOLDOWN);
        setError('');
        setOtp(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
    };

    const maskedContact = method === 'phone'
        ? `****${contact.slice(-4)}`
        : contact.replace(/(.{2})(.*)(@.*)/, '$1***$3');

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
            <View style={styles.content}>
                {/* Back Button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={[styles.backButtonText, isDarkMode && styles.darkText]}>
                        ← Back
                    </Text>
                </TouchableOpacity>

                {/* Header */}
                <Text style={[styles.title, isDarkMode && styles.darkText]}>
                    Verify OTP
                </Text>
                <Text style={[styles.subtitle, isDarkMode && styles.darkTextMuted]}>
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
                                isDarkMode && styles.darkOtpInput,
                                digit && styles.otpInputFilled,
                                error && styles.otpInputError,
                                success && styles.otpInputSuccess,
                            ]}
                            value={digit}
                            onChangeText={value => handleOtpChange(value, index)}
                            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                            keyboardType="number-pad"
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
                    <Text style={[styles.resendText, isDarkMode && styles.darkTextMuted]}>
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

                {/* Mock Notice */}
                <Text style={[styles.mockNotice, isDarkMode && styles.darkTextMuted]}>
                    🔧 Demo Mode: Use OTP "{MOCK_VALID_OTP}" to verify
                </Text>
            </View>
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
        color: '#3b82f6',
        fontWeight: '500',
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
        lineHeight: 24,
    },
    contactText: {
        fontWeight: '600',
    },
    darkText: {
        color: '#ffffff',
    },
    darkTextMuted: {
        color: '#999999',
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
        backgroundColor: '#f5f5f5',
        borderWidth: 2,
        borderColor: '#e0e0e0',
        fontSize: 24,
        fontWeight: '600',
        textAlign: 'center',
        color: '#1a1a1a',
    },
    darkOtpInput: {
        backgroundColor: '#2a2a2a',
        borderColor: '#3a3a3a',
        color: '#ffffff',
    },
    otpInputFilled: {
        borderColor: '#3b82f6',
    },
    otpInputError: {
        borderColor: '#ef4444',
        backgroundColor: '#fef2f2',
    },
    otpInputSuccess: {
        borderColor: '#22c55e',
        backgroundColor: '#f0fdf4',
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
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#93c5fd',
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
        color: '#666666',
    },
    resendLink: {
        fontSize: 14,
        color: '#3b82f6',
        fontWeight: '600',
    },
    resendLinkDisabled: {
        color: '#999999',
    },
    mockNotice: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        marginTop: 32,
    },
});
