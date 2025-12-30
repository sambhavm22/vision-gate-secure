import React, { useEffect, useState } from 'react';
import { supabase } from "@vision-gate/supabase/client";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, useToast, Dialog, DialogContent } from "@vision-gate/ui";
import { format } from "date-fns";
import { Calendar, RefreshCw, Pause, Play, XCircle } from "lucide-react";
import { RRule } from 'rrule';

interface RecurringBooking {
    id: string;
    rrule: string;
    status: 'active' | 'paused' | 'cancelled';
    worker?: { full_name: string };
    service_ids: number[]; // In V1 assume single service
    preferred_time_start: string;
    total_per_occurrence: number;
    created_at: string;
}

const RecurringBookingsList = () => {
    const { toast } = useToast();
    const [bookings, setBookings] = useState<RecurringBooking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecurring();
    }, []);

    const fetchRecurring = async () => {
        try {
            const { data, error } = await supabase
                .from('recurring_bookings')
                .select(`
            *,
            worker:preferred_worker_id(full_name)
        `)
                .neq('status', 'cancelled') // Hide cancelled generally? Or show them? Let's show active/paused
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBookings(data as any || []);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, action: 'pause' | 'resume' | 'cancel') => {
        try {
            const { error } = await supabase.rpc('manage_recurring_booking', {
                p_recurring_id: id,
                p_action: action
            });

            if (error) throw error;

            toast({ title: "Updated", description: `Series ${action}d successfully.` });
            fetchRecurring();

        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    const getFrequencyLabel = (rruleStr: string) => {
        try {
            const rule = RRule.fromString(rruleStr);
            return rule.toText(); // English description e.g. "every week on Monday"
        } catch {
            return "Custom Schedule";
        }
    };

    if (loading) return <div>Loading schedules...</div>;

    if (bookings.length === 0) {
        return (
            <div className="text-center py-10 bg-muted/20 rounded-xl">
                <RefreshCw className="h-10 w-10 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground">No active recurring bookings found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {bookings.map((booking) => (
                <Card key={booking.id} className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    {booking.worker?.full_name || "Any Helper"}
                                    <Badge variant={booking.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                                        {booking.status}
                                    </Badge>
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1 capitalize">
                                    {getFrequencyLabel(booking.rrule)} at {booking.preferred_time_start}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-lg">₹{booking.total_per_occurrence}</p>
                                <p className="text-xs text-muted-foreground">per visit</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-end gap-2 pt-2">
                            {booking.status === 'active' && (
                                <Button size="sm" variant="outline" onClick={() => handleAction(booking.id, 'pause')}>
                                    <Pause className="h-4 w-4 mr-1" /> Pause
                                </Button>
                            )}
                            {booking.status === 'paused' && (
                                <Button size="sm" variant="outline" onClick={() => handleAction(booking.id, 'resume')}>
                                    <Play className="h-4 w-4 mr-1" /> Resume
                                </Button>
                            )}
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleAction(booking.id, 'cancel')}>
                                <XCircle className="h-4 w-4 mr-1" /> Cancel Series
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default RecurringBookingsList;
