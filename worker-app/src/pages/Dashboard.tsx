import { BookingCard } from "@/components/BookingCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

export default function Dashboard() {
    const { workerProfile } = useAuth();
    const { toast } = useToast();
    const [marketBookings, setMarketBookings] = useState<any[]>([]);
    const [myBookings, setMyBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchBookings = async () => {
        if (!workerProfile) return;
        setIsLoading(true);
        try {
            // 1. Fetch Market Bookings (RPC)
            const { data: marketData, error: marketError } = await supabase.rpc(
                "get_market_bookings",
                { p_worker_id: workerProfile.id }
            );
            if (marketError) throw marketError;
            setMarketBookings(marketData || []);

            // 2. Fetch My Bookings (Direct Select)
            const { data: myData, error: myError } = await supabase
                .from("bookings")
                .select(`
          *,
          service:services(name),
          address:addresses(address_line1, city, location)
        `)
                .eq("worker_id", workerProfile.id)
                .neq("status", "requested") // Should be matched/accepted/etc
                .order("scheduled_at", { ascending: true });

            if (myError) throw myError;
            setMyBookings(myData || []);

        } catch (error: any) {
            toast({ variant: "destructive", title: "Error fetching bookings", description: error.message });
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, [workerProfile]);

    const handleAccept = async (bookingId: string) => {
        if (!workerProfile) return;
        setProcessingId(bookingId);
        try {
            const { error } = await supabase.rpc("accept_booking", {
                p_booking_id: bookingId,
                p_worker_id: workerProfile.id
            });

            if (error) throw error;

            toast({
                title: "Booking Accepted",
                description: "You have successfully accepted the job.",
            });

            // Refresh list
            await fetchBookings();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Accept Failed", description: error.message });
        } finally {
            setProcessingId(null);
        }
    };

    // Simplistic Cancel (Not full RPC logic as requested to verify MVP)
    // For MVP, allow cancel if status is accepted/matched.
    // Ideally, this should reset status to 'requested' and remove worker_id?
    const handleCancel = async (bookingId: string) => {
        if (!confirm("Are you sure you want to cancel this booking?")) return;
        setProcessingId(bookingId);
        try {
            // Logic: Update to cancelled or release it back to pool?
            // Requirement: "Worker must be able to cancel".
            // Let's release it back to pool ('requested', worker_id = null)
            const { error } = await supabase
                .from("bookings")
                .update({ status: 'requested', worker_id: null })
                .eq("id", bookingId)
                .eq("worker_id", workerProfile?.id); // Security check

            if (error) throw error;

            toast({ title: "Booking Cancelled", description: "The booking has been released." });
            await fetchBookings();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setProcessingId(null);
        }
    };

    if (!workerProfile) return null;

    return (
        <div className="container mx-auto max-w-4xl py-6 px-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Welcome, {workerProfile.full_name}</h1>
                    <p className="text-gray-500">Manage your jobs and find new ones.</p>
                </div>
                <Button variant="outline" size="icon" onClick={fetchBookings} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            <Tabs defaultValue="marketplace" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="marketplace">New Requests ({marketBookings.length})</TabsTrigger>
                    <TabsTrigger value="my-jobs">My Schedule ({myBookings.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="marketplace" className="space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : marketBookings.length === 0 ? (
                        <div className="text-center p-8 text-gray-500">No new requests in your area matching your services.</div>
                    ) : (
                        marketBookings.map(booking => (
                            <BookingCard
                                key={booking.id}
                                booking={booking}
                                type="marketplace"
                                onAccept={handleAccept}
                                isProcessing={processingId === booking.id}
                            />
                        ))
                    )}
                </TabsContent>

                <TabsContent value="my-jobs" className="space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : myBookings.length === 0 ? (
                        <div className="text-center p-8 text-gray-500">You have no upcoming jobs.</div>
                    ) : (
                        myBookings.map(booking => (
                            <BookingCard
                                key={booking.id}
                                booking={booking}
                                type="my-jobs"
                                onCancel={handleCancel}
                                isProcessing={processingId === booking.id}
                            />
                        ))
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
