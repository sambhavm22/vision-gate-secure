import { BookingCard } from "@/components/BookingCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@vision-gate/supabase/client";
import { Briefcase, CalendarClock, Loader2, MapPinOff, RefreshCw, Star, TrendingUp } from "lucide-react";
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
                { p_worker_id: workerProfile.id } as any
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
            } as any);

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
        if (!workerProfile) return;
        if (!confirm("Are you sure you want to cancel this booking?")) return;
        setProcessingId(bookingId);
        try {
            // Logic: Update to cancelled or release it back to pool?
            // Requirement: "Worker must be able to cancel".
            // Let's release it back to pool ('requested', worker_id = null)
            const { error } = await supabase
                .from("bookings")
                // @ts-ignore
                .update({ status: 'requested', worker_id: null })
                .eq("id", bookingId)
                .eq("worker_id", workerProfile.id); // Security check

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
        <div className="min-h-screen bg-slate-50/50">
            <div className="bg-white border-b sticky top-0 z-10 px-6 py-4 flex justify-between items-center shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        HelperHub
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700 hidden sm:inline-block">
                        {workerProfile.full_name}
                    </span>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {workerProfile.full_name?.charAt(0)}
                    </div>
                </div>
            </div>

            <div className="container mx-auto max-w-5xl py-8 px-4 space-y-8">
                {/* Welcome Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h2>
                        <p className="text-gray-500 mt-1">
                            Welcome back! Here's what's happening in your area.
                        </p>
                    </div>
                    <Button onClick={fetchBookings} disabled={isLoading} className="shadow-sm">
                        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh Feed
                    </Button>
                </div>

                {/* Stats Overview */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="hover:shadow-md transition-all duration-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{myBookings.length}</div>
                            <p className="text-xs text-muted-foreground">Scheduled bookings</p>
                        </CardContent>
                    </Card>
                    <Card className="hover:shadow-md transition-all duration-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Rating</CardTitle>
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{workerProfile.rating?.toFixed(1) || "New"}</div>
                            <p className="text-xs text-muted-foreground">Average customer rating</p>
                        </CardContent>
                    </Card>
                    <Card className="hover:shadow-md transition-all duration-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Status</CardTitle>
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">Online</div>
                            <p className="text-xs text-muted-foreground">Visible to customers</p>
                        </CardContent>
                    </Card>
                    <Card className="hover:shadow-md transition-all duration-200 bg-primary/5 border-primary/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-primary">New Opportunities</CardTitle>
                            <TrendingUp className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary">{marketBookings.length}</div>
                            <p className="text-xs text-primary/80">Jobs available nearby</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Tabs */}
                <Tabs defaultValue="marketplace" className="w-full">
                    <TabsList className="grid w-full md:w-[400px] grid-cols-2 mb-6">
                        <TabsTrigger value="marketplace">New Requests ({marketBookings.length})</TabsTrigger>
                        <TabsTrigger value="my-jobs">My Schedule ({myBookings.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="marketplace" className="space-y-4 min-h-[300px]">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center p-12 text-gray-400 space-y-4">
                                <Loader2 className="h-8 w-8 animate-spin" />
                                <p>Finding jobs near you...</p>
                            </div>
                        ) : marketBookings.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-gray-50 text-center">
                                <div className="p-4 rounded-full bg-gray-100 mb-4">
                                    <MapPinOff className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">No new requests</h3>
                                <p className="text-gray-500 max-w-sm mt-1">
                                    There are currently no job requests in your service area. Check back soon!
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                                {marketBookings.map(booking => (
                                    <BookingCard
                                        key={booking.id}
                                        booking={booking}
                                        type="marketplace"
                                        onAccept={handleAccept}
                                        isProcessing={processingId === booking.id}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="my-jobs" className="space-y-4 min-h-[300px]">
                        {isLoading ? (
                            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
                        ) : myBookings.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-gray-50 text-center">
                                <CalendarClock className="h-10 w-10 text-gray-300 mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900">No upcoming jobs</h3>
                                <p className="text-gray-500">Your schedule is clear.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                                {myBookings.map(booking => (
                                    <BookingCard
                                        key={booking.id}
                                        booking={booking}
                                        type="my-jobs"
                                        onCancel={handleCancel}
                                        isProcessing={processingId === booking.id}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
