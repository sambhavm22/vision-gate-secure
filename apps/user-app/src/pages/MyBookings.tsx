import RecurringBookingsList from "@/components/RecurringBookingsList";
import { supabase } from "@vision-gate/supabase/client";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Dialog, DialogContent, DialogHeader, DialogTitle, Tabs, TabsContent, TabsList, TabsTrigger, useToast } from "@vision-gate/ui";
import { format } from "date-fns";
import { ArrowLeft, Clock, MapPin, RefreshCw, Star, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
  // User rating for this booking
  rating: number | null;
  review: string | null;
}

const MyBookings = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Rating State
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [ratingBookingId, setRatingBookingId] = useState<string | null>(null);
  const [ratingVal, setRatingVal] = useState(5);
  const [reviewVal, setReviewVal] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [paymentBooking, setPaymentBooking] = useState<Booking | null>(null);

  const handlePaymentConfirm = async (method: string) => {
    if (!paymentBooking) return;
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'paid' } as any)
        .eq('id', paymentBooking.id);

      if (error) throw error;

      toast({
        title: "Payment Successful",
        description: `Payment of ₹${paymentBooking.total_amount} recorded via ${method.toUpperCase()}.`
      });

      setBookings(prev => prev.map(b => b.id === paymentBooking.id ? { ...b, status: 'paid' } : b));
      if (selectedBooking?.id === paymentBooking.id) {
        setSelectedBooking(prev => prev ? { ...prev, status: 'paid' } : null);
      }
      setPaymentBooking(null);
    } catch (err: any) {
      toast({ title: "Payment Error", description: err.message, variant: "destructive" });
    }
  };

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

      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          scheduled_at,
          status,
          total_amount,
          duration_minutes,
          notes,
          rating,
          review,
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
      setBookings(data as any || []);
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

  const openRatingDialog = (bookingId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setRatingBookingId(bookingId);
    setRatingVal(5);
    setReviewVal("");
    setShowRatingDialog(true);
  };

  const handleSubmitRating = async () => {
    if (!ratingBookingId) return;

    setIsSubmittingRating(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          rating: ratingVal,
          review: reviewVal
        } as any)
        .eq("id", ratingBookingId)
        .eq("status", "completed"); // Security double-check

      if (error) throw error;

      toast({
        title: "Rating Submitted",
        description: "Thank you for your feedback!",
      });

      // Optimistic update or wait for realtime
      setBookings(prev => prev.map(b =>
        b.id === ratingBookingId ? { ...b, rating: ratingVal, review: reviewVal } : b
      ));
      setShowRatingDialog(false);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit rating",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const upcomingBookings = bookings.filter(b => new Date(b.scheduled_at) >= new Date());
  const pastBookings = bookings.filter(b => new Date(b.scheduled_at) < new Date());

  const renderBookingList = (list: Booking[], emptyMessage: string) => {
    if (list.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">{emptyMessage}</p>
            <Button onClick={() => navigate("/dashboard")}>
              {t('bookings.book_first')}
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {list.map((booking) => (
          <Card
            key={booking.id}
            className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-primary group"
            onClick={() => setSelectedBooking(booking)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{booking.service?.name ? t(`services.${booking.service.name}`, booking.service.name) : t('bookings.service_request')}</CardTitle>
                <div className="flex items-center gap-2">
                  {booking.status === "completed" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPaymentBooking(booking);
                        }}
                        className="bg-green-600 hover:bg-green-700 h-8"
                      >
                        Pay ₹{booking.total_amount}
                      </Button>
                      {!booking.rating && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => openRatingDialog(booking.id, e)}
                          className="mr-2 text-yellow-600 border-yellow-200 hover:bg-yellow-50 h-8"
                        >
                          <Star className="h-4 w-4 mr-1" /> {t('bookings.rate_worker')}
                        </Button>
                      )}
                    </div>
                  )}
                  {booking.rating && (
                    <div className="flex items-center text-yellow-500 mr-2 bg-yellow-50 px-2 py-1 rounded-full border border-yellow-100 text-sm font-bold">
                      {booking.rating} ★
                    </div>
                  )}
                  <Badge variant={getStatusVariant(booking.status) as any}>
                    {t(`status.${booking.status}`, booking.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()))}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  {booking.worker ? (
                    <>
                      <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t('bookings.helper')}</p>
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
                        <p className="text-sm text-muted-foreground">{t('bookings.helper')}</p>
                        <p className="italic text-gray-500">{t('bookings.searching')}</p>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('bookings.scheduled_for')}</p>
                    <p className="font-medium">
                      {new Date(booking.scheduled_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                {(booking.address || booking.notes || t('bookings.location_not_specified')) && (
                  <div className="flex items-start gap-2 md:col-span-2">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t('bookings.details_location')}</p>
                      <p className="font-medium">
                        {booking.address ? (
                          `${booking.address.address_line1}${booking.address.city ? `, ${booking.address.city}` : ''}`
                        ) : (
                          booking.notes?.replace(/^Location:\s*/i, '') || t('bookings.location_not_specified')
                        )}
                      </p>
                    </div>
                  </div>
                )}

                <div className="md:col-span-2 pt-2 border-t flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('bookings.total_amount')}</span>
                  <span className="text-lg font-bold text-primary">₹{booking.total_amount}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">{t('bookings.my_bookings')}</h1>
              <p className="text-muted-foreground">{t('bookings.subtitle')}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBookings}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {t('dashboard.refresh_feed', 'Refresh Feed')}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="bookings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="recurring">Recurring Series</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <Tabs defaultValue="upcoming" className="mt-4">
              <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="past">Past</TabsTrigger>
              </TabsList>
              <TabsContent value="upcoming" className="mt-4">
                {renderBookingList(upcomingBookings, "No upcoming bookings found.")}
              </TabsContent>
              <TabsContent value="past" className="mt-4">
                {renderBookingList(pastBookings, "No past bookings found.")}
              </TabsContent>
            </Tabs>
          </TabsContent>
          <TabsContent value="recurring">
            <RecurringBookingsList />
          </TabsContent>
        </Tabs>
      </div>

      {/* Booking Details Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{t('bookings.booking_details')}</DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6 pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{selectedBooking.service?.name ? t(`services.${selectedBooking.service.name}`, selectedBooking.service.name) : ""}</h3>
                  <p className="text-sm text-muted-foreground">{t('bookings.booking_id')}: {selectedBooking.id.slice(0, 8)}...</p>
                </div>
                <div className="text-right">
                  <Badge variant={getStatusVariant(selectedBooking.status) as any} className="capitalize mb-2 block">
                    {t(`status.${selectedBooking.status}`, selectedBooking.status.replace('_', ' '))}
                  </Badge>
                  {selectedBooking.status === "completed" && (
                    <div className="flex gap-2 justify-end mb-2">
                      <Button
                        size="sm"
                        onClick={() => setPaymentBooking(selectedBooking)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Pay Now
                      </Button>
                      {!selectedBooking.rating && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-9"
                          onClick={(e) => openRatingDialog(selectedBooking.id, e)}
                        >
                          {t('bookings.rate_now')}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {selectedBooking.rating && (
                <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl">
                  <p className="text-xs uppercase font-bold text-yellow-700 mb-1">{t('bookings.you_rated')}</p>
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${i < selectedBooking.rating! ? "fill-yellow-500 text-yellow-500" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                  {selectedBooking.review && (
                    <p className="text-sm text-gray-700 italic">"{selectedBooking.review}"</p>
                  )}
                </div>
              )}

              <div className="space-y-4 bg-muted/30 p-4 rounded-xl">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">{t('bookings.scheduled_for')}</p>
                    <p className="font-medium">{format(new Date(selectedBooking.scheduled_at), "PPP p")}</p>
                    <p className="text-sm text-muted-foreground">{t('bookings.minutes_duration', { minutes: selectedBooking.duration_minutes })}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">{t('bookings.service_location')}</p>
                    {selectedBooking.address ? (
                      <>
                        <p className="font-semibold text-primary">{selectedBooking.address.label || t('address.home')}</p>
                        <p className="font-medium">{selectedBooking.address.address_line1}</p>
                        {selectedBooking.address.address_line2 && <p className="text-sm">{selectedBooking.address.address_line2}</p>}
                        <p className="text-sm text-muted-foreground">
                          {selectedBooking.address.city}, {selectedBooking.address.postal_code}
                        </p>
                      </>
                    ) : (
                      <p className="font-medium italic text-muted-foreground">
                        {selectedBooking.notes?.replace(/^Location:\s*/i, '') || t('bookings.location_not_specified')}
                      </p>
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
                    <p className="text-xs uppercase text-muted-foreground font-bold">{t('bookings.assigned_helper')}</p>
                    <p className="font-bold">{selectedBooking.worker.full_name}</p>
                    <div className="flex items-center gap-1 text-sm text-yellow-600">
                      <span className="font-bold">{selectedBooking.worker.rating}</span> ★
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-3">
                  <div className="animate-pulse h-4 w-4 bg-blue-400 rounded-full" />
                  <p className="text-blue-700 text-sm font-medium">{t('bookings.looking_for')}</p>
                </div>
              )}

              {selectedBooking.notes && (
                <div className="space-y-1">
                  <p className="text-xs uppercase text-muted-foreground font-bold">{t('bookings.additional_notes')}</p>
                  <p className="text-sm bg-slate-50 p-3 rounded-lg border border-slate-100 italic">"{selectedBooking.notes}"</p>
                </div>
              )}

              <div className="pt-4 border-t flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-muted-foreground font-bold">{t('bookings.total_payable')}</p>
                  <p className="text-2xl font-black text-primary">₹{selectedBooking.total_amount}</p>
                </div>
                <Button onClick={() => setSelectedBooking(null)}>{t('bookings.close')}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">{t('rating.title')}</DialogTitle>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center">
            <div className="flex gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-8 w-8 cursor-pointer transition-all hover:scale-110 ${star <= ratingVal ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                  onClick={() => setRatingVal(star)}
                />
              ))}
            </div>
            <p className="font-medium text-lg mb-4">{ratingVal === 5 ? t('rating.excellent') : ratingVal === 4 ? t('rating.good') : ratingVal === 3 ? t('rating.average') : t('rating.poor')}</p>

            <textarea
              className="w-full border rounded-md p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none min-h-[100px]"
              placeholder={t('rating.placeholder')}
              value={reviewVal}
              onChange={(e) => setReviewVal(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRatingDialog(false)}>{t('rating.cancel')}</Button>
            <Button onClick={handleSubmitRating} disabled={isSubmittingRating}>
              {isSubmittingRating ? t('common.loading') : t('rating.submit')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PaymentDialog
        booking={paymentBooking}
        open={!!paymentBooking}
        onOpenChange={(open) => !open && setPaymentBooking(null)}
        onConfirm={handlePaymentConfirm}
      />
    </div>
  );
};

// Payment Dialog Implementation
const PaymentDialog = ({ booking, open, onOpenChange, onConfirm }: {
  booking: Booking | null,
  open: boolean,
  onOpenChange: (open: boolean) => void,
  onConfirm: (method: string) => Promise<void>
}) => {
  const [method, setMethod] = useState("upi");
  const [loading, setLoading] = useState(false);

  if (!booking) return null;

  const handlePay = async () => {
    setLoading(true);
    await onConfirm(method);
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-primary/5 p-4 rounded-xl text-center">
            <p className="text-muted-foreground text-sm uppercase tracking-wide">Amount Payable</p>
            <p className="text-4xl font-black text-primary">₹{booking.total_amount}</p>
          </div>

          <div className="space-y-3">
            <p className="font-semibold text-sm">Select Payment Mode</p>
            <div
              onClick={() => setMethod('upi')}
              className={`p-3 border rounded-lg flex items-center justify-between cursor-pointer ${method === 'upi' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-gray-400'}`}
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" /></svg>
                </div>
                <div>
                  <p className="font-medium text-sm">UPI / Online</p>
                  <p className="text-xs text-muted-foreground">GPay, PhonePe, Card</p>
                </div>
              </div>
              {method === 'upi' && <div className="h-4 w-4 bg-primary rounded-full border-2 border-white ring-1 ring-primary" />}
            </div>

            <div
              onClick={() => setMethod('cash')}
              className={`p-3 border rounded-lg flex items-center justify-between cursor-pointer ${method === 'cash' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-gray-400'}`}
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect width="20" height="12" x="2" y="6" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01m12 0h.01" /></svg>
                </div>
                <div>
                  <p className="font-medium text-sm">Cash</p>
                  <p className="text-xs text-muted-foreground">Pay to Helper Directly</p>
                </div>
              </div>
              {method === 'cash' && <div className="h-4 w-4 bg-primary rounded-full border-2 border-white ring-1 ring-primary" />}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handlePay} disabled={loading}>{loading ? 'Processing...' : `Pay ₹${booking.total_amount}`}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MyBookings;
