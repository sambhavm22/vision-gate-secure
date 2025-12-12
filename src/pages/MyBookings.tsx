import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Clock, MapPin, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Booking {
  id: string;
  service: {
    name: string;
  };
  scheduled_at: string;
  status: string;
  // location: string; // Not in DB yet, stored in notes
  notes: string | null;
  total_amount: number;
  worker?: {
    full_name: string;
    // phone: string; // Not in public schema yet? Check workers_public.
    rating: number;
  } | null;
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

      // Check types.ts or runtime for exact relationship names. Usually 'workers_public' and 'services'
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          scheduled_at,
          status,
          total_amount,
          notes,
          service:service_id (
            name
          ),
          worker:worker_id (
            full_name,
            rating
          )
        `)
        .eq("customer_id", session.user.id) // Correct column name
        .order("scheduled_at", { ascending: false });

      if (error) throw error;
      setBookings(data as any || []); // Casting as any for now to bypass strict generic checks if types aren't perfect
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
      case "matched":
      case "en_route":
      case "in_progress":
        return "default"; // Active
      case "completed":
      case "paid":
        return "secondary"; // Done
      case "cancelled":
        return "destructive";
      case "requested":
      default:
        return "outline"; // Pending/Requested
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

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
                    <CardTitle className="text-xl">{booking.service?.name || 'Service Request'}</CardTitle>
                    <Badge variant={getStatusVariant(booking.status) as any}>
                      {booking.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      {booking.worker ? (
                        <>
                          <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Helper</p>
                            <p className="font-medium">{booking.worker.full_name}</p>
                            <div className="flex items-center text-xs text-yellow-600">
                              <span className="font-bold mr-1">{booking.worker.rating}</span> ★
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Helper</p>
                            <p className="italic text-gray-500">Searching...</p>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Scheduled For</p>
                        <p className="font-medium">
                          {new Date(booking.scheduled_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {(booking.notes || 'Location not specified') && (
                      <div className="flex items-start gap-2 md:col-span-2">
                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Details / Location</p>
                          <p className="font-medium">{booking.notes}</p>
                        </div>
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
