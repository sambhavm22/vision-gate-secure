import { Badge } from "@vision-gate/ui";
import { Button } from "@vision-gate/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@vision-gate/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@vision-gate/ui";
import { useToast } from "@vision-gate/ui";
import { supabase } from "@vision-gate/supabase/client";
import { format } from "date-fns";
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
  notes: string | null;
  total_amount: number;
  duration_minutes: number;
  worker?: {
    full_name: string;
    rating: number;
    profile_image_url?: string;
  } | null;
  address?: {
    address_line1: string;
    address_line2: string | null;
    city: string | null;
    postal_code: string | null;
    label: string | null;
  } | null;
}

const MyBookings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    let channel: any;

    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      fetchBookings(); // Initial load

      channel = supabase.channel('my-bookings-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
            filter: `customer_id=eq.${session.user.id}`
          },
          () => {
            fetchBookings();
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
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
          duration_minutes,
          notes,
          service:service_id (
            name
          ),
          worker:worker_id (
            full_name,
            rating,
            profile_image_url
          ),
          address:address_id (
            address_line1,
            address_line2,
            city,
            postal_code,
            label
          )
        `)
        .eq("customer_id", session.user.id)
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
              <Card
                key={booking.id}
                className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-primary"
                onClick={() => setSelectedBooking(booking)}
              >
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

      {/* Booking Details Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Booking Details</DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6 pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{selectedBooking.service?.name}</h3>
                  <p className="text-sm text-muted-foreground">Booking ID: {selectedBooking.id.slice(0, 8)}...</p>
                </div>
                <Badge variant={getStatusVariant(selectedBooking.status) as any} className="capitalize">
                  {selectedBooking.status.replace('_', ' ')}
                </Badge>
              </div>

              <div className="space-y-4 bg-muted/30 p-4 rounded-xl">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Scheduled For</p>
                    <p className="font-medium">{format(new Date(selectedBooking.scheduled_at), "PPP p")}</p>
                    <p className="text-sm text-muted-foreground">{selectedBooking.duration_minutes} Minutes Duration</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Service Location</p>
                    {selectedBooking.address ? (
                      <>
                        <p className="font-semibold text-primary">{selectedBooking.address.label || 'Home'}</p>
                        <p className="font-medium">{selectedBooking.address.address_line1}</p>
                        {selectedBooking.address.address_line2 && <p className="text-sm">{selectedBooking.address.address_line2}</p>}
                        <p className="text-sm text-muted-foreground">
                          {selectedBooking.address.city}, {selectedBooking.address.postal_code}
                        </p>
                      </>
                    ) : (
                      <p className="font-medium italic text-muted-foreground">Location details not available in record</p>
                    )}
                  </div>
                </div>
              </div>

              {selectedBooking.worker ? (
                <div className="border rounded-xl p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {selectedBooking.worker.profile_image_url ? (
                      <img src={selectedBooking.worker.profile_image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs uppercase text-muted-foreground font-bold">Assigned Helper</p>
                    <p className="font-bold">{selectedBooking.worker.full_name}</p>
                    <div className="flex items-center gap-1 text-sm text-yellow-600">
                      <span className="font-bold">{selectedBooking.worker.rating}</span> ★
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-3">
                  <div className="animate-pulse h-4 w-4 bg-blue-400 rounded-full" />
                  <p className="text-blue-700 text-sm font-medium">Looking for a nearby helper...</p>
                </div>
              )}

              {selectedBooking.notes && (
                <div className="space-y-1">
                  <p className="text-xs uppercase text-muted-foreground font-bold">Additional Notes</p>
                  <p className="text-sm bg-slate-50 p-3 rounded-lg border border-slate-100 italic">"{selectedBooking.notes}"</p>
                </div>
              )}

              <div className="pt-4 border-t flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-muted-foreground font-bold">Total Payable</p>
                  <p className="text-2xl font-black text-primary">₹{selectedBooking.total_amount}</p>
                </div>
                <Button onClick={() => setSelectedBooking(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyBookings;
