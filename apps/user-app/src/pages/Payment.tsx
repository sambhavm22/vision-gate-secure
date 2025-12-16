import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@vision-gate/supabase/client";
import { ArrowLeft, Banknote, CheckCircle2, Circle, CreditCard, Landmark, Smartphone } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Payment = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const [state] = useState<any>(location.state || {});
    const [selectedMethod, setSelectedMethod] = useState("upi");

    const paymentMethods = [
        {
            id: "upi",
            icon: Smartphone,
            label: "UPI",
            description: "Google Pay, PhonePe, Paytm"
        },
        {
            id: "card",
            icon: CreditCard,
            label: "Credit / Debit Card",
            description: "Visa, Mastercard, RuPay"
        },
        {
            id: "netbanking",
            icon: Landmark,
            label: "Net Banking",
            description: "All major banks supported"
        },
        {
            id: "cash",
            icon: Banknote,
            label: "Pay After Service",
            description: "Cash or UPI after service completion"
        }
    ];

    const handlePayment = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                toast({
                    title: "Authentication Required",
                    description: "Please log in to complete your booking.",
                    variant: "destructive"
                });
                navigate("/login");
                return;
            }

            toast({
                title: "Processing Payment...",
                description: "Please wait while we confirm your booking.",
            });

            // Use the create_booking RPC for transaction-safe booking
            const { data: bookingId, error } = await supabase.rpc('create_booking', {
                customer_uuid: session.user.id,
                service_id_input: state.service_id || 1, // Fallback to 1 if not passed
                address_id_input: null, // Address selection not implemented in this flow yet
                scheduled_at_input: new Date(Date.now() + 15 * 60000).toISOString(), // "Arriving in 15 Min"
                duration_minutes_input: (state.duration || 1) * 60,
                preferred_worker_id_input: null
            });

            if (error) throw error;

            toast({
                title: selectedMethod === 'cash' ? "Booking Confirmed" : "Payment Successful",
                description: selectedMethod === 'cash'
                    ? "Your service has been booked. You can pay after completion."
                    : "Your transaction was successful and booking is confirmed!",
            });

            setTimeout(() => {
                navigate("/my-bookings");
            }, 1500);

        } catch (error: any) {
            console.error("Booking Error:", error);
            toast({
                title: "Booking Failed",
                description: error.message || "Something went wrong. Please try again.",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 font-sans">
            <div className="max-w-md mx-auto pt-8">
                <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>

                <h1 className="text-2xl font-bold mb-6">Confirm & Pay</h1>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-lg">Booking Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b">
                            <span className="text-muted-foreground">Service</span>
                            <span className="font-semibold">{state.service || "Standard Service"}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b">
                            <span className="text-muted-foreground">Duration</span>
                            <span className="font-semibold">{state.label || "1 Hour"}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b">
                            <span className="text-muted-foreground">Rate</span>
                            <span>{state.rate ? `₹${state.rate}/hr` : "Standard Rate"}</span>
                        </div>

                        <div className="flex justify-between items-center pt-2 text-lg font-bold">
                            <span>Total</span>
                            <span className="text-primary">₹{state.price || "0"}</span>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <h3 className="font-semibold mb-2">Payment Method</h3>
                    <div className="grid gap-3">
                        {paymentMethods.map((method) => (
                            <div
                                key={method.id}
                                onClick={() => setSelectedMethod(method.id)}
                                className={`border rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all duration-200 ${selectedMethod === method.id
                                    ? "bg-primary/5 border-primary ring-1 ring-primary"
                                    : "bg-white hover:border-gray-400"
                                    }`}
                            >
                                <div className={`p-2 rounded-full ${selectedMethod === method.id ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500"}`}>
                                    <method.icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <p className={`font-medium ${selectedMethod === method.id ? "text-primary" : "text-gray-900"}`}>
                                        {method.label}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{method.description}</p>
                                </div>
                                {selectedMethod === method.id ? (
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                ) : (
                                    <Circle className="h-5 w-5 text-gray-300" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <Button className="w-full mt-8" size="lg" onClick={handlePayment}>
                    {selectedMethod === 'cash' ? 'Confirm Booking' : `Pay ₹${state.price || "0"}`}
                </Button>
            </div>
        </div>
    );
};

export default Payment;
