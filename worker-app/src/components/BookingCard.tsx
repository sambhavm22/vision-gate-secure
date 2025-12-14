import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Banknote, Calendar, CheckCircle, Clock, MapPin, XCircle } from "lucide-react";

interface BookingCardProps {
    booking: any; // Using any for flexibility with RPC vs Table select shapes, specifically for this MVP
    type: 'marketplace' | 'my-jobs';
    onAccept?: (id: string) => void;
    onCancel?: (id: string) => void;
    isProcessing?: boolean;
}

export function BookingCard({ booking, type, onAccept, onCancel, isProcessing }: BookingCardProps) {
    const isMarket = type === 'marketplace';

    // Normalize data access (RPC vs Join)
    const serviceName = booking.service_name || booking.service?.name;
    const addressLine = booking.address_line1 || booking.address?.address_line1;
    const city = booking.city || booking.address?.city;
    const price = booking.total_amount;
    const scheduledAt = new Date(booking.scheduled_at);

    return (
        <Card className="w-full mb-4 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-bold">
                    {serviceName}
                </CardTitle>
                <Badge variant={isMarket ? "default" : "secondary"}>
                    {isMarket ? "New Request" : booking.status}
                </Badge>
            </CardHeader>
            <CardContent>
                <div className="grid gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{addressLine}, {city}</span>
                        {booking.dist_meters && (
                            <span className="text-xs text-muted-foreground">
                                ({(booking.dist_meters / 1000).toFixed(1)} km away)
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{format(scheduledAt, "PPP")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{format(scheduledAt, "p")} ({booking.duration_minutes} mins)</span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold text-green-700">
                        <Banknote className="h-4 w-4" />
                        <span>₹{price}</span>
                    </div>
                    {booking.notes && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs italic">
                            "{booking.notes}"
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                {isMarket && onAccept && (
                    <Button onClick={() => onAccept(booking.id)} disabled={isProcessing}>
                        {isProcessing ? "Accepting..." : "Accept Job"}
                        <CheckCircle className="ml-2 h-4 w-4" />
                    </Button>
                )}
                {!isMarket && onCancel && (
                    <Button variant="destructive" size="sm" onClick={() => onCancel(booking.id)} disabled={isProcessing}>
                        Cancel
                        <XCircle className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
