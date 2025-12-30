import type { RecurringBooking } from "@/types";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@vision-gate/ui";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, Repeat } from "lucide-react";
import { RRule } from "rrule";

interface RecurringJobCardProps {
    booking: RecurringBooking;
}

export function RecurringJobCard({ booking }: RecurringJobCardProps) {

    const getFrequencyLabel = (rruleStr: string) => {
        try {
            const rule = RRule.fromString(rruleStr);
            return rule.toText();
        } catch {
            return "Custom Schedule";
        }
    };

    return (
        <Card className="hover:shadow-md transition-all border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            Recurring Service
                            <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                                <Repeat className="h-3 w-3 mr-1" /> Series
                            </Badge>
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            {getFrequencyLabel(booking.rrule)}
                        </p>
                    </div>
                    <Badge variant={booking.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                        {booking.status}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium text-foreground">{booking.preferred_time_start}</span>
                        <span>({booking.duration_minutes / 60} hrs)</span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>From {format(new Date(booking.start_date), "PPP")}</span>
                        {booking.end_date && <span> to {format(new Date(booking.end_date), "PPP")}</span>}
                    </div>

                    {booking.address && (
                        <div className="flex items-start gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4 mt-0.5" />
                            <div>
                                <p className="font-medium text-foreground">{booking.address.city}</p>
                                <p className="text-xs truncate max-w-[200px]">{booking.address.address_line1}</p>
                            </div>
                        </div>
                    )}

                    <div className="pt-3 mt-1 border-t flex justify-between items-center">
                        <span className="text-muted-foreground">Per Visit:</span>
                        <span className="font-bold text-lg text-primary">₹{booking.total_per_occurrence}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
