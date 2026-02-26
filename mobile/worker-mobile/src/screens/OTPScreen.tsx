import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
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

type Props = NativeStackScreenProps<RootStackParamList, 'OTP'> & {
    onAuthSuccess?: () => void;
};

export function OTPScreen({ route, onAuthSuccess }: Props): React.JSX.Element {
    const { contact } = route.params;
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(30);
    const inputRefs = useRef<(TextInput | null)[]>([]);

    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    const handleOtpChange = (text: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        // Auto-advance to next input
        if (text && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all digits entered
        if (text && index === 5) {
            const fullOtp = newOtp.join('');
            if (fullOtp.length === 6) {
                handleVerifyOTP(fullOtp);
            }
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOTP = async (otpCode?: string) => {
        const code = otpCode || otp.join('');
        if (code.length !== 6) {
            Alert.alert('Invalid OTP', 'Please enter the 6-digit code.');
            return;
        }

        setLoading(true);
        try {
            const { data, error: verifyError } = await supabase.auth.verifyOtp({
                phone: contact,
                token: code,
                type: 'sms',
            });

            if (verifyError) throw verifyError;

            if (!data.session) {
                throw new Error('Verification failed. No session returned.');
            }

            onAuthSuccess?.();
        } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        try {
            const { error: resendError } = await supabase.auth.signInWithOtp({
                phone: contact,
            });

            if (resendError) throw resendError;

            setResendTimer(30);
            Alert.alert('OTP Sent', 'A new OTP has been sent to your phone.');
        } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to resend');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.inner}
            >
                <View style={styles.headerSection}>
                    <Text style={styles.title}>Verify OTP</Text>
                    <Text style={styles.subtitle}>
                        Enter the 6-digit code sent to {contact}
                    </Text>
                </View>

                <View style={styles.otpRow}>
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => { inputRefs.current[index] = ref; }}
                            style={[styles.otpInput, digit ? styles.otpInputActive : null]}
                            value={digit}
                            onChangeText={(text) => handleOtpChange(text, index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            keyboardType="number-pad"
                            maxLength={1}
                            selectTextOnFocus
                        />
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.verifyButton, loading && styles.disabledButton]}
                    onPress={() => handleVerifyOTP()}
                    disabled={loading}
                    activeOpacity={0.7}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.verifyButtonText}>Verify & Login</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleResend}
                    disabled={resendTimer > 0}
                    style={styles.resendButton}
                >
                    <Text style={[styles.resendText, resendTimer > 0 && styles.resendDisabled]}>
                        {resendTimer > 0
                            ? `Resend OTP in ${resendTimer}s`
                            : 'Resend OTP'}
                    </Text>
                </TouchableOpacity>
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
        marginBottom: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#f8fafc',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
    },
    otpRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 32,
    },
    otpInput: {
        width: 48,
        height: 56,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#334155',
        backgroundColor: '#1e293b',
        color: '#f8fafc',
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    otpInputActive: {
        borderColor: '#10b981',
    },
    verifyButton: {
        backgroundColor: '#10b981',
        borderRadius: 10,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 20,
    },
    disabledButton: {
        opacity: 0.7,
    },
    verifyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    resendButton: {
        alignItems: 'center',
    },
    resendText: {
        fontSize: 14,
        color: '#10b981',
        fontWeight: '500',
    },
    resendDisabled: {
        color: '#64748b',
    },
});
