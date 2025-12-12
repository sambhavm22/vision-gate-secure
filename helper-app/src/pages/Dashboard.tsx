import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, LogOut, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Booking {
    id: string;
    booking_date: string;
    booking_time: string;
    location: string;
    status: string;
    total_amount: number;
    service_type: string;
    user_id: string; // The client who booked
}

interface Helper {
    id: string;
    full_name: string;
    service_type: string;
    email: string;
}

const Dashboard = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [helper, setHelper] = useState<Helper | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            navigate("/login");
            return;
        }
        setUser(session.user);
        fetchHelperProfile(session.user.email);
    };

    const fetchHelperProfile = async (email: string | undefined) => {
        if (!email) return;

        try {
            // Find helper record matching the logged-in user's email
            const { data: helpers, error } = await supabase
                .from("helpers")
                .select("*")
                .eq("email", email)
                .single(); // Assuming one helper per email

            if (error) {
                if (error.code === 'PGRST116') {
                    // No rows found - User is logged in but has no helper profile
                    // In a real app, we'd redirect to "Create Profile"
                    console.log("No helper profile found for this email.");
                } else {
                    throw error;
                }
            }

            if (helpers) {
                setHelper(helpers);
                fetchBookings(helpers.id);
            }
        } catch (error) {
            console.error("Error fetching helper profile:", error);
            toast({
                title: "Error",
                description: "Failed to load profile",
                variant: "destructive",
            });
        } finally {
            if (!helper) setLoading(false); // Stop loading if no helper found
        }
    };

    const fetchBookings = async (helperId: string) => {
        try {
            const { data, error } = await supabase
                .from("bookings")
                .select("*")
                .eq("helper_id", helperId)
                .order("booking_date", { ascending: true });

            if (error) throw error;
            setBookings(data || []);
        } catch (error) {
            console.error("Error fetching bookings:", error);
            toast({
                title: "Error",
                description: "Failed to load bookings",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/login");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <h1 className="text-xl font-bold">Helper Portal</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground hidden md:inline">{user?.email}</span>
                        <Button variant="ghost" size="icon" onClick={handleLogout}>
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {!helper ? (
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-bold mb-4">Complete your Profile</h2>
                        <p className="text-muted-foreground mb-6">You need to set up your helper profile to start receiving jobs.</p>
                        <Button>Create Profile</Button>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-3xl font-bold">Welcome, {helper.full_name}</h2>
                                <p className="text-muted-foreground">{helper.service_type}</p>
                            </div>
                        </div>

                        <section>
                            <h3 className="text-xl font-semibold mb-4">My Bookings</h3>
                            {bookings.length === 0 ? (
                                <p className="text-muted-foreground">No upcoming bookings.</p>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {bookings.map((booking) => (
                                        <Card key={booking.id}>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-lg flex justify-between">
                                                    <span>Booking #{booking.id.slice(0, 4)}</span>
                                                    <span className={`text-sm px-2 py-1 rounded-full ${booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {booking.status}
                                                    </span>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="text-sm space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    <span>{booking.booking_date}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                    <span>{booking.booking_time}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    <span>{booking.location}</span>
                                                </div>
                                                <div className="pt-2 border-t mt-2 flex justify-between items-center">
                                                    <span className="font-semibold">₹{booking.total_amount}</span>
                                                    {booking.status === 'pending' && (
                                                        <Button size="sm">Accept</Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
