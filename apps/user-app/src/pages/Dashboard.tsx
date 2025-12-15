import { useState, useMemo, useEffect } from "react";
import { Sun, Moon, Search, Sparkles, Home, Calendar, User, LogOut, Star, MapPin, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import AIChatbot from "@/components/AIChatbot";
import logo from "@/assets/helperhub-logo.png";

interface Service {
  id: string;
  name: string;
  description: string;
  image_url: string;
  base_price: number;
}

interface Helper {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  service_type: string;
  rating: number;
  total_reviews: number;
  experience_years: number;
  hourly_rate: number;
  profile_image_url: string | null;
  verified: boolean;
  bio: string;
  city: string;
}

interface Availability {
  id: string;
  helper_id: string;
  available_date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState<string>("all");
  const [services, setServices] = useState<Service[]>([]);
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [selectedHelper, setSelectedHelper] = useState<Helper | null>(null);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [showAvailability, setShowAvailability] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingLocation, setBookingLocation] = useState("");

  useEffect(() => {
    fetchServices();
    fetchHelpers();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
    }
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("name");

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive",
      });
    }
  };

  const fetchHelpers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("helpers")
        .select("*")
        .order("rating", { ascending: false });

      if (error) throw error;
      setHelpers(data || []);
    } catch (error) {
      console.error("Error fetching helpers:", error);
      toast({
        title: "Error",
        description: "Failed to load helpers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async (helperId: string) => {
    try {
      const { data, error } = await supabase
        .from("helper_availability")
        .select("*")
        .eq("helper_id", helperId)
        .eq("is_booked", false)
        .gte("available_date", new Date().toISOString().split("T")[0])
        .order("available_date");

      if (error) throw error;
      setAvailability(data || []);
    } catch (error) {
      console.error("Error fetching availability:", error);
      toast({
        title: "Error",
        description: "Failed to load availability",
        variant: "destructive",
      });
    }
  };

  const handleServiceClick = (serviceName: string) => {
    setSelectedService(serviceName);
  };

  const handleHelperClick = async (helper: Helper) => {
    setSelectedHelper(helper);
    setShowAvailability(true);
    await fetchAvailability(helper.id);
  };

  const handleBooking = async () => {
    if (!selectedHelper || !bookingDate || !bookingTime || !bookingLocation) {
      toast({
        title: "Missing Information",
        description: "Please fill in all booking details",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const { error } = await supabase.from("bookings").insert({
        user_id: session.user.id,
        helper_id: selectedHelper.id,
        service_type: selectedHelper.service_type,
        booking_date: bookingDate,
        booking_time: bookingTime,
        location: bookingLocation,
        total_amount: selectedHelper.hourly_rate,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Booking Confirmed!",
        description: `Your booking with ${selectedHelper.full_name} has been confirmed.`,
      });

      setShowAvailability(false);
      setSelectedHelper(null);
      setBookingDate("");
      setBookingTime("");
      setBookingLocation("");
    } catch (error) {
      console.error("Error creating booking:", error);
      toast({
        title: "Booking Failed",
        description: "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const filteredHelpers = useMemo(() => {
    return helpers.filter((helper) => {
      const matchesSearch = helper.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        helper.service_type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesService = selectedService === "all" || helper.service_type === selectedService;
      return matchesSearch && matchesService;
    });
  }, [helpers, searchQuery, selectedService]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-background transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logo} alt="HelperHub" className="h-10" />
            {!isMobile && <h1 className="text-xl font-bold">HelperHub</h1>}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <Home className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/my-bookings")}>
              <Calendar className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search helpers or services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Services" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.name}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Services Grid */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {services.map((service) => (
              <Card
                key={service.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden group"
                onClick={() => handleServiceClick(service.name)}
              >
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={service.image_url}
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <h3 className="text-white font-semibold text-sm">{service.name}</h3>
                    <p className="text-white/80 text-xs">₹{service.base_price}/hr</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Helpers Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {selectedService === "all" ? "All Helpers" : `${selectedService} Helpers`}
            </h2>
            <Badge variant="secondary">{filteredHelpers.length} Available</Badge>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading helpers...</p>
            </div>
          ) : filteredHelpers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No helpers found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredHelpers.map((helper) => (
                <Card
                  key={helper.id}
                  className="cursor-pointer hover:shadow-xl transition-all duration-300"
                  onClick={() => handleHelperClick(helper)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-2xl font-bold">
                          {helper.full_name.charAt(0)}
                        </div>
                        {helper.verified && (
                          <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-1">
                            <Sparkles className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{helper.full_name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{helper.service_type}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{helper.rating}</span>
                          <span className="text-xs text-muted-foreground">({helper.total_reviews})</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{helper.city}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{helper.experience_years} years experience</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="font-semibold text-primary">₹{helper.hourly_rate}/hr</span>
                        <Button size="sm">Book Now</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Availability Dialog */}
      <Dialog open={showAvailability} onOpenChange={setShowAvailability}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book {selectedHelper?.full_name}</DialogTitle>
          </DialogHeader>

          {selectedHelper && (
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-2xl font-bold">
                  {selectedHelper.full_name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{selectedHelper.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedHelper.service_type}</p>
                  <p className="text-sm mt-2">{selectedHelper.bio}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{selectedHelper.rating}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {selectedHelper.experience_years} years exp
                    </span>
                    <span className="text-sm font-semibold text-primary">
                      ₹{selectedHelper.hourly_rate}/hr
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Date</label>
                  <Input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Select Time</label>
                  <Input
                    type="time"
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Location</label>
                  <Input
                    placeholder="Enter your address"
                    value={bookingLocation}
                    onChange={(e) => setBookingLocation(e.target.value)}
                  />
                </div>

                {availability.length > 0 && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Available Slots</label>
                    <div className="grid grid-cols-2 gap-2">
                      {availability.slice(0, 6).map((slot) => (
                        <Badge key={slot.id} variant="outline" className="justify-center py-2">
                          {new Date(slot.available_date).toLocaleDateString()} - {slot.start_time} to {slot.end_time}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button onClick={handleBooking} className="w-full" size="lg">
                  Confirm Booking
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AIChatbot />
    </div>
  );
};

export default Dashboard;
