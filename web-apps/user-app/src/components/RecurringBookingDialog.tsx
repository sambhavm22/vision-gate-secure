import { supabase } from '@vision-gate/supabase/client';
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, useToast } from '@vision-gate/ui'; // Mock imports
import { format } from 'date-fns';
import React, { useState } from 'react';
import RecurringOptions, { RecurringOptionsResult } from './RecurringOptions';

interface RecurringBookingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    serviceId: number;
    serviceName: string;
    workerId: string | null;
    workerName: string;
    hourlyRate: number;
    initialDate: string; // YYYY-MM-DD
    initialTime: string; // HH:MM
    addressId: string; // Assuming we have this
    userId: string;
}

const RecurringBookingDialog: React.FC<RecurringBookingDialogProps> = ({
    open,
    onOpenChange,
    serviceId,
    serviceName,
    workerId,
    workerName,
    hourlyRate,
    initialDate,
    initialTime,
    addressId,
    userId
}) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);
    const [schedule, setSchedule] = useState<RecurringOptionsResult | null>(null);
    const [selectedMethod, setSelectedMethod] = useState("upi");

    // Duration hardcoded to 2 hours for mvp or passed in? 
    const durationValues = [2];
    const [duration, setDuration] = useState(2); // hours

    const totalPerVisit = hourlyRate * duration;

    // Reset step on close
    React.useEffect(() => {
        if (!open) setStep(1);
    }, [open]);

    const handleNext = () => {
        if (!schedule) return;
        setStep(2);
    };

    const handleBook = async () => {
        if (!schedule) return;

        setLoading(true);
        try {
            // 1. Prepare Data
            const payload = {
                p_user_id: userId,
                p_service_ids: [serviceId],
                p_address_id: addressId,
                p_preferred_worker_id: workerId,
                p_rrule: schedule.rrule,
                p_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                p_start_date: format(schedule.startDate, 'yyyy-MM-dd'),
                p_end_date: schedule.endDate ? format(schedule.endDate, 'yyyy-MM-dd') : null,
                p_max_occurrences: null,
                p_preferred_time_start: initialTime,
                p_preferred_time_end: addHours(initialTime, duration),
                p_duration_minutes: duration * 60,
                p_notes: `Recurring ${schedule.frequency} via Web. Payment via ${selectedMethod.toUpperCase()}`,
                // Payment placeholder - in real app we would create a SetupIntent here if Card
                p_stripe_customer_id: selectedMethod === 'cash' ? null : 'cus_TEST',
                p_stripe_payment_method_id: selectedMethod === 'cash' ? null : 'pm_TEST'
            };

            // 2. Call RPC
            const { error } = await supabase.rpc('create_recurring_booking', payload);

            if (error) throw error;

            toast({
                title: "Recurring Series Created!",
                description: `Your ${schedule.frequency.toLowerCase()} schedule with ${workerName} is set.`
            });

            onOpenChange(false);

        } catch (err: any) {
            console.error(err);
            toast({
                title: "Error",
                description: err.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Helper to add hours to HH:MM
    const addHours = (time: string, h: number) => {
        const [hr, min] = time.split(':').map(Number);
        const newHr = (hr + h) % 24;
        return `${newHr.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
    };

    const paymentMethods = [
        { id: "upi", label: "UPI", description: "Google Pay, PhonePe, Paytm" },
        { id: "card", label: "Credit / Debit Card", description: "Visa, Mastercard, RuPay" },
        { id: "netbanking", label: "Net Banking", description: "All major banks supported" },
        { id: "cash", label: "Pay After Service", description: "Cash or UPI after service completion" }
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Setup Recurring Service - {step === 1 ? "Schedule" : "Payment"}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Summary Header */}
                    <div className="bg-primary/10 p-3 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{serviceName}</p>
                            <p className="text-sm text-muted-foreground">with {workerName}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-primary">₹{totalPerVisit}/visit</p>
                            <p className="text-xs text-muted-foreground">{duration} hrs</p>
                        </div>
                    </div>

                    {step === 1 ? (
                        <>
                            {/* Step 1: Core Options */}
                            <RecurringOptions
                                initialStartDate={new Date(initialDate)}
                                onChange={setSchedule}
                            />

                            {/* Schedule Summary Preview */}
                            {schedule && (
                                <div className="text-sm border-l-4 border-primary pl-3 py-1 bg-slate-50">
                                    <p className="font-medium">Summary:</p>
                                    <p className="text-muted-foreground">
                                        Starts {format(schedule.startDate, 'PPP')}.
                                        Repeats {schedule.frequency.toLowerCase()}.
                                        {schedule.endDate ? `Ends ${format(schedule.endDate, 'PPP')}.` : 'Indefinitely.'}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1 break-all font-mono bg-slate-100 p-1 rounded">
                                        {schedule.rrule}
                                    </p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* Step 2: Payment */}
                            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Payment Preference (Pay Per Visit)</h3>
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
                                        <div className="flex-1">
                                            <p className={`font-medium ${selectedMethod === method.id ? "text-primary" : "text-gray-900"}`}>
                                                {method.label}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{method.description}</p>
                                        </div>
                                        <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${selectedMethod === method.id ? "border-primary bg-primary" : "border-gray-300"}`}>
                                            {selectedMethod === method.id && <div className="h-1.5 w-1.5 bg-white rounded-full" />}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-2">
                                <div className="flex items-start gap-2">
                                    <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                                    <p className="text-sm text-blue-800">
                                        <span className="font-bold">No Advance Payment:</span> You will only be charged <span className="font-bold">₹{totalPerVisit}</span> after each completed visit.
                                    </p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                                    <p className="text-sm text-blue-800">
                                        You can change your payment method or pay cash for each visit after service.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {step === 1 ? (
                        <>
                            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button onClick={handleNext} disabled={!schedule}>
                                Next: Payment
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                            <Button onClick={handleBook} disabled={loading}>
                                {loading ? 'Confirming...' : 'Confirm Subscription'}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default RecurringBookingDialog;
