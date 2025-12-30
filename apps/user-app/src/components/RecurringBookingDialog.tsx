import React, { useState } from 'react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, useToast } from '@vision-gate/ui'; // Mock imports
import RecurringOptions, { RecurringOptionsResult } from './RecurringOptions';
import { supabase } from '@vision-gate/supabase/client';
import { format } from 'date-fns';

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
    const [schedule, setSchedule] = useState<RecurringOptionsResult | null>(null);

    // Duration hardcoded to 2 hours for mvp or passed in? 
    // Should ideally be passed in. Let's assume 2 hours default or pass as prop if needed.
    const durationValues = [2];
    const [duration, setDuration] = useState(2); // hours

    const handleBook = async () => {
        if (!schedule) return;

        setLoading(true);
        try {
            // 1. Prepare Data
            // rrule string from RecurringOptions might need tweaks? 
            // It handles DTSTART/UNTIL/COUNT etc. inside the string.
            // But database schema separates start_date, end_date, etc. for querying convenience.
            // We pass the full RRULE string for the generator.

            const payload = {
                p_user_id: userId,
                p_service_ids: [serviceId],
                p_address_id: addressId,
                p_preferred_worker_id: workerId,
                p_rrule: schedule.rrule,
                p_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                p_start_date: format(schedule.startDate, 'yyyy-MM-dd'),
                p_end_date: schedule.endDate ? format(schedule.endDate, 'yyyy-MM-dd') : null, // or undefined
                p_max_occurrences: null, // extracted from rrule if count is set?
                // Actually, RecurringOptions sets COUNT in RRULE string, but we also store columns.
                // If we want redundancy, we'd need to parse options back out. 
                // For V1, the DB function uses these params primarily for metadata/indexing?
                // Wait, generate-occurrences uses RRULE string primarily. 
                // Let's pass what we know.

                p_preferred_time_start: initialTime,
                p_preferred_time_end: addHours(initialTime, duration), // Helper needed
                p_duration_minutes: duration * 60,
                p_notes: `Recurring ${schedule.frequency} via Web`,
                // Payment placeholder
                p_stripe_customer_id: 'cus_TEST',
                p_stripe_payment_method_id: 'pm_TEST'
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Setup Recurring Service</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Summary Header */}
                    <div className="bg-primary/10 p-3 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{serviceName}</p>
                            <p className="text-sm text-muted-foreground">with {workerName}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-primary">₹{hourlyRate * duration}/visit</p>
                            <p className="text-xs text-muted-foreground">{duration} hrs</p>
                        </div>
                    </div>

                    {/* Core Options */}
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
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleBook} disabled={loading || !schedule}>
                        {loading ? 'Creating...' : 'Create Recurring Series'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default RecurringBookingDialog;
