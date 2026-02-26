
import { AddressSelectionDialog } from "@/components/AddressSelectionDialog";
import { supabase } from "@vision-gate/supabase/client";
import { Button, Card, CardContent, CardHeader, CardTitle, useToast } from "@vision-gate/ui";
import { ArrowLeft, Banknote, CheckCircle2, Circle, CreditCard, Landmark, Pencil, Smartphone } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Payment = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const [state] = useState<any>(location.state || {});
    const [selectedMethod, setSelectedMethod] = useState("upi");

    // Address Edit State
    const [currentAddress, setCurrentAddress] = useState<any>(state.address || null);
    const [showAddressDialog, setShowAddressDialog] = useState(false);

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

            // Validation: Ensure address is selected
            if (!currentAddress && !state.notes) {
                // If no address object, check if maybe logic allowed text location in pure notes, 
                // but getting real address is better.
                toast({
                    title: "Address Required",
                    description: "Please select an address for the service.",
                    variant: "destructive"
                });
                return;
            }

            toast({
                title: "Processing Payment...",
                description: "Please wait while we confirm your booking.",
            });

            // Use the create_booking RPC for transaction-safe booking
            // Standardize inputs (handle both 'date' and 'scheduledDate' conventions)
            const rawDate = state.date || state.scheduledDate;
            const rawTime = state.time || state.scheduledTime;

            let scheduledAt: string;

            if (rawDate && rawTime) {
                // Handle both Date objects and strings
                const dateStr = typeof rawDate !== 'string' ? format(new Date(rawDate), 'yyyy-MM-dd') : rawDate;
                scheduledAt = new Date(`${dateStr}T${rawTime}`).toISOString();
            } else {
                scheduledAt = new Date(Date.now() + 15 * 60000).toISOString();
            }

            const { data: bookingId, error } = await (supabase.rpc as any)('create_booking', {
                service_id_input: state.service_id || 1,
                address_id_input: currentAddress?.id || null,
                scheduled_at_input: scheduledAt,
                duration_minutes_input: (state.duration || 1) * 60,
                notes_input: state.notes || `Location: ${state.service || 'Service'}`
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
        <div className="min-h-screen bg-slate-50 dark:bg-background p-4 font-sans">
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
                            <span>{state.rate ? `₹${state.rate} /hr` : "Standard Rate"}</span >
                        </div >

                        <div className="flex justify-between items-start pb-2 border-b">
                            <span className="text-muted-foreground">Location</span>
                            <div className="text-right w-1/2">
                                {currentAddress ? (
                                    <>
                                        <span className="text-sm font-medium block">
                                            {currentAddress.label ? <span className="font-bold block text-xs text-primary mb-0.5">{currentAddress.label}</span> : null}
                                            {currentAddress.address_line1}, {currentAddress.city}
                                        </span>
                                        <Button
                                            variant="link"
                                            className="h-auto p-0 text-xs text-primary mt-1"
                                            onClick={() => setShowAddressDialog(true)}
                                        >
                                            <Pencil className="h-3 w-3 mr-1" /> Change Address
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs"
                                        onClick={() => setShowAddressDialog(true)}
                                    >
                                        <Pencil className="h-3 w-3 mr-1" /> Add Address
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-2 text-lg font-bold">
                            <span>Total</span>
                            <span className="text-primary">₹{state.price || "0"}</span>
                        </div>
                    </CardContent >
                </Card >

                <AddressSelectionDialog
                    open={showAddressDialog}
                    onOpenChange={setShowAddressDialog}
                    onSelect={(addr) => {
                        setCurrentAddress(addr);
                        setShowAddressDialog(false);
                        toast({ title: "Address Updated", description: "Booking location updated." });
                    }}
                    currentLocation={localStorage.getItem("userLocation") || "Mumbai"}
                />

                <div className="space-y-4">
                    <h3 className="font-semibold mb-2">Payment Method</h3>
                    <div className="grid gap-3">
                        {paymentMethods.map((method) => (
                            <div
                                key={method.id}
                                onClick={() => setSelectedMethod(method.id)}
                                className={`border rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all duration-200 ${selectedMethod === method.id
                                    ? "bg-primary/5 border-primary ring-1 ring-primary"
                                    : "bg-white dark:bg-card hover:border-gray-400 dark:hover:border-border"
                                    }`}
                            >
                                <div className={`p-2 rounded-full ${selectedMethod === method.id ? "bg-primary/10 text-primary" : "bg-gray-100 dark:bg-secondary text-gray-500 dark:text-muted-foreground"}`}>
                                    <method.icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <p className={`font-medium ${selectedMethod === method.id ? "text-primary" : "text-gray-900 dark:text-foreground"}`}>
                                        {method.label}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{method.description}</p>
                                </div>
                                {selectedMethod === method.id ? (
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                ) : (
                                    <Circle className="h-5 w-5 text-gray-300 dark:text-slate-600" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <Button className="w-full mt-8" size="lg" onClick={handlePayment}>
                    {selectedMethod === 'cash' ? 'Confirm Booking' : `Pay ₹${state.price || "0"}`}
                </Button>
            </div >
        </div >
    );
};

export default Payment;
