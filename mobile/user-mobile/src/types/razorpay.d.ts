declare module 'react-native-razorpay' {
    interface RazorpayOptions {
        description?: string;
        image?: string;
        currency?: string;
        key: string;
        amount: number;
        name?: string;
        order_id: string;
        prefill?: {
            email?: string;
            contact?: string;
            name?: string;
        };
        theme?: {
            color?: string;
        };
    }

    interface RazorpayPaymentResponse {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
    }

    const RazorpayCheckout: {
        open(options: RazorpayOptions): Promise<RazorpayPaymentResponse>;
    };

    export default RazorpayCheckout;
}
