/**
 * useRazorpay Hook
 * Encapsulates the full Razorpay payment flow:
 *   1. Create order (Edge Function)
 *   2. Open checkout (Razorpay SDK)
 *   3. Verify payment (Edge Function)
 *
 * ⚠️ react-native-razorpay requires a custom Expo dev client (EAS Build).
 *    The SDK is LAZY-LOADED so the app still runs in Expo Go for all other
 *    features — only the "Pay & Book" button will show an error in Expo Go.
 */

import { useState } from 'react';
import { supabase } from '../services/supabase';

// ⚠️ TEST MODE — Replace with your Razorpay Test Key ID (starts with rzp_test_)
// Get it from: https://dashboard.razorpay.com/app/keys
const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_ID';

interface PaymentResult {
    success: boolean;
    paymentId?: string;
    error?: string;
}

interface UserPrefill {
    name?: string;
    email?: string;
    contact?: string;
}

export function useRazorpay() {
    const [loading, setLoading] = useState(false);

    const initiatePayment = async (
        bookingId: string,
        amount: number,
        prefill: UserPrefill = {}
    ): Promise<PaymentResult> => {
        setLoading(true);
        try {
            // Lazy-load Razorpay SDK (avoids crash in Expo Go at startup)
            let RazorpayCheckout: any;
            try {
                RazorpayCheckout = (await import('react-native-razorpay')).default;
            } catch (e) {
                return {
                    success: false,
                    error: 'Razorpay SDK not available. Please use a development build (EAS Build) to test payments. The app works in Expo Go for all other features.',
                };
            }

            // 1. Get auth session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                return { success: false, error: 'Not authenticated' };
            }

            // 2. Create Razorpay order via Edge Function
            const { data: fnData, error: fnError } = await supabase.functions.invoke(
                'create-razorpay-order',
                {
                    body: { booking_id: bookingId, amount },
                }
            );

            if (fnError || !fnData?.order_id) {
                return {
                    success: false,
                    error: fnError?.message || fnData?.error || 'Failed to create payment order',
                };
            }

            const { order_id, amount: amountPaise, currency, key_id } = fnData;

            // 3. Open Razorpay Checkout
            const options = {
                description: 'Service Booking Payment',
                image: 'https://your-logo-url.com/logo.png', // Replace with actual logo URL
                currency: currency || 'INR',
                key: key_id || RAZORPAY_KEY_ID,
                amount: amountPaise,
                name: 'HelperHub',
                order_id: order_id,
                prefill: {
                    email: prefill.email || '',
                    contact: prefill.contact || '',
                    name: prefill.name || '',
                },
                theme: { color: '#10b981' },
            };

            const paymentData = await RazorpayCheckout.open(options);

            // 4. Verify payment via Edge Function
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
                'verify-razorpay-payment',
                {
                    body: {
                        razorpay_order_id: paymentData.razorpay_order_id,
                        razorpay_payment_id: paymentData.razorpay_payment_id,
                        razorpay_signature: paymentData.razorpay_signature,
                        booking_id: bookingId,
                    },
                }
            );

            if (verifyError || !verifyData?.verified) {
                return {
                    success: false,
                    error: verifyError?.message || verifyData?.error || 'Payment verification failed',
                };
            }

            return {
                success: true,
                paymentId: paymentData.razorpay_payment_id,
            };
        } catch (err: any) {
            // Handle user cancellation (Razorpay SDK returns error code 0)
            if (err?.code === 0 || err?.description?.includes('cancelled')) {
                return { success: false, error: 'Payment cancelled by user' };
            }

            // Handle native module not available
            if (err?.message?.includes('native module') || err?.message?.includes('NativeModule')) {
                return {
                    success: false,
                    error: 'Razorpay requires a development build. Payments cannot be tested in Expo Go.',
                };
            }

            // Handle network / other errors
            return {
                success: false,
                error: err?.description || err?.message || 'Payment failed. Please try again.',
            };
        } finally {
            setLoading(false);
        }
    };

    return { initiatePayment, loading };
}
