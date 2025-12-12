import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle2, CreditCard } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Payment = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const [state, setState] = useState<any>(location.state || {});

    // In a real app, you would validate the state here and redirect if missing
    // useEffect(() => {
    //  if (!state.service || !state.price) navigate('/dashboard');
    // }, [state, navigate]);

    const handlePayment = () => {
        toast({
            title: "Payment Successful",
            description: "Your booking has been confirmed!",
        });
        setTimeout(() => {
            navigate("/my-bookings");
        }, 1500);
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
                    <div className="grid gap-4">
                        <div className="border rounded-xl p-4 flex items-center gap-4 bg-white cursor-pointer hover:border-primary transition-colors ring-1 ring-primary/5">
                            <CreditCard className="h-6 w-6 text-primary" />
                            <div className="flex-1">
                                <p className="font-medium">Credit / Debit Card</p>
                                <p className="text-xs text-muted-foreground">Pay securely with your card</p>
                            </div>
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                        </div>
                        {/* More methods can be added here */}
                    </div>
                </div>

                <Button className="w-full mt-8" size="lg" onClick={handlePayment}>
                    Pay ₹{state.price || "0"}
                </Button>
            </div>
        </div>
    );
};

export default Payment;
