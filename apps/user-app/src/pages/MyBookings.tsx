import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, User, ArrowLeft, Clock } from "lucide-react";

interface Booking {
  id: string;
  service_type: string;
  booking_date: string;
  booking_time: string;
  status: string;
  location: string;
  total_amount: number;
  notes: string | null;
  helpers: {
    full_name: string;
    phone: string;
    rating: number;
  };
}

const MyBookings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          helpers (
            full_name,
            phone,
            rating
          )
        `)
        .eq("user_id", session.user.id)
        .order("booking_date", { ascending: false });

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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default";
      case "completed":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Mock bookings data - will be replaced with actual data from database
  const mockBookings = [
    {
      id: 1,
      service: "Daily Cleaning",
      date: "2024-01-15",
      time: "10:00 AM",
      helper: "Marvin Smith",
      location: "North Delhi",
      status: "confirmed",
    },
    {
      id: 2,
      service: "Cook",
      date: "2024-01-20",
      time: "8:00 AM",
      helper: "Brooklyn Simmons",
      location: "South Delhi",
      status: "pending",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold">My Bookings</h1>
          <p className="text-muted-foreground">View and manage your service bookings</p>
        </div>
        
        {bookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No bookings yet</p>
              <Button onClick={() => navigate("/dashboard")}>
                Book Your First Service
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{booking.service_type}</CardTitle>
                    <Badge variant={getStatusVariant(booking.status)}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Helper</p>
                        <p className="font-medium">{booking.helpers.full_name}</p>
                        <p className="text-sm text-muted-foreground">{booking.helpers.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Date & Time</p>
                        <p className="font-medium">
                          {new Date(booking.booking_date).toLocaleDateString()} at {booking.booking_time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 md:col-span-2">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">{booking.location}</p>
                      </div>
                    </div>
                    {booking.notes && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground">Notes</p>
                        <p className="text-sm">{booking.notes}</p>
                      </div>
                    )}
                    <div className="md:col-span-2 pt-2 border-t flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Amount</span>
                      <span className="text-lg font-bold text-primary">₹{booking.total_amount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
