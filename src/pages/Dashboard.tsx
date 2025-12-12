import logo from "@/assets/helperhub-logo.png";
import AIChatbot from "@/components/AIChatbot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Calendar, Clock, Home, LogOut, MapPin, Moon, Sparkles, Star, Sun, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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
  const [showServiceGuidelines, setShowServiceGuidelines] = useState(false);
  const [activeGuidelineService, setActiveGuidelineService] = useState<string>("");
  const [showDurationDialog, setShowDurationDialog] = useState(false);

  const durationOptions = [
    { label: "1 Hour", hours: 1, multiplier: 1 },
    { label: "1.5 Hours", hours: 1.5, multiplier: 1.5 },
    { label: "2 Hours", hours: 2, multiplier: 2 },
    { label: "Full Day (8 Hrs)", hours: 8, multiplier: 8 },
  ];

  const serviceGuidelines: Record<string, { dos: string[]; donts: string[] }> = {
    "Laundry": {
      dos: [
        "Separate whites and colored clothes.",
        "Check pockets for loose items.",
        "Provide detergent and fabric softener.",
        "Specify delicate items.",
      ],
      donts: [
        "Don't overload the washing machine.",
        "Don't mix heavily soiled items with lightly soiled ones.",
        "Don't leave wet clothes in the machine for too long.",
      ]
    },
    "Dishwashing": {
      dos: ["Scrape leftover food into the bin.", "Soak stubborn stains.", "Provide dish soap and sponges."],
      donts: ["Don't leave sharp knives in soapy water.", "Don't overload the dishwasher."]
    },
    "Everyday Cleaning": {
      dos: ["Clear clutter before the cleaner arrives.", "Secure pets.", "Provide access to cleaning supplies."],
      donts: ["Don't expect deep stain removal in a standard clean.", "Don't hover over the cleaner while they work."]
    },
    "Weekly Cleaning": {
      dos: ["List priority areas.", "Ensure electricity and water access."],
      donts: ["Don't add extra tasks last minute."]
    },
    "Bathroom Cleaning": {
      dos: ["Remove personal items from counters.", "Ventilate the area."],
      donts: ["Don't use bleach without ventilation."]
    },
    "Kitchen Prep": {
      dos: ["Provide clear instructions on cuts/sizes.", "Ensure knives are sharp."],
      donts: ["Don't leave expired food in the fridge to be sorted unless requested."]
    }
  };

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
    setActiveGuidelineService(serviceName);
    setShowServiceGuidelines(true);
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

          <div className="flex items-center gap-4 hidden md:flex text-sm text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
            <MapPin className="h-4 w-4 text-primary" />
            <span>Current Location: <span className="font-medium text-foreground">Mumbai, India</span></span>
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

        {/* Mobile Location Display */}
        <div className="md:hidden flex items-center gap-2 mb-6 text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
          <MapPin className="h-4 w-4 text-primary" />
          <span>Current Location: <span className="font-medium text-foreground">Mumbai, India</span></span>
        </div>

        {/* Hero / Offers Section */}
        <section className="mb-12">
          <div className="grid md:grid-cols-2 gap-6 items-center bg-gradient-to-r from-primary/10 to-secondary/10 p-8 rounded-3xl">
            <div>
              <Badge className="mb-4" variant="secondary">Special Offer</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary">Get 20% Off <br /><span className="text-foreground">On Your First Booking</span></h1>
              <p className="text-muted-foreground text-lg mb-6">Experience top-rated service professionals at unbeatable prices. Valid for all new users this month.</p>
              <Button size="lg" className="rounded-full px-8">Book Now</Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card p-4 rounded-2xl shadow-sm border">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                </div>
                <div className="font-semibold">Deep Cleaning</div>
                <div className="text-xs text-muted-foreground">Starts ₹499</div>
              </div>
              <div className="bg-card p-4 rounded-2xl shadow-sm border">
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <User className="h-5 w-5 text-green-600" />
                </div>
                <div className="font-semibold">Expert Cooks</div>
                <div className="text-xs text-muted-foreground">Starts ₹399</div>
              </div>
              <div className="bg-card p-4 rounded-2xl shadow-sm border">
                <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div className="font-semibold">Quick Service</div>
                <div className="text-xs text-muted-foreground">Within 60 mins</div>
              </div>
              <div className="bg-card p-4 rounded-2xl shadow-sm border">
                <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                  <Star className="h-5 w-5 text-orange-600" />
                </div>
                <div className="font-semibold">Top Rated</div>
                <div className="text-xs text-muted-foreground">4.8+ Average</div>
              </div>
            </div>
          </div>
        </section>

        {/* Search and Filters
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
        </div> */}

        {/* Services Grid */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Our Services</h2>
            <p className="text-muted-foreground">Book hourly and avail multiple services</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Row 1: Large Cards */}
            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden group h-64 relative"
              onClick={() => handleServiceClick('Everyday Cleaning')}
            >
              <img src="/src/assets/cleaning-service.jpg" alt="Everyday Cleaning" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <h3 className="text-white text-2xl font-bold">Everyday<br />Cleaning</h3>
              </div>
            </Card>
            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden group h-64 relative"
              onClick={() => handleServiceClick('Weekly Cleaning')}
            >
              <img src="/src/assets/cleaning-service.jpg" alt="Weekly Cleaning" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <h3 className="text-white text-2xl font-bold">Weekly<br />Cleaning</h3>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Row 2: Small Cards */}
            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden group h-40 relative"
              onClick={() => handleServiceClick('Laundry')}
            >
              <img src="/src/assets/laundry-service.png" alt="Laundry" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 opacity-90" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center p-2 text-center">
                <h3 className="text-white font-bold text-lg leading-tight shadow-md">Laundry</h3>
              </div>
            </Card>
            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden group h-40 relative"
              onClick={() => handleServiceClick('Dishwashing')}
            >
              <img src="/src/assets/dishwashing-service.png" alt="Dishwashing" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 opacity-90" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center p-2 text-center">
                <h3 className="text-white font-bold text-lg leading-tight shadow-md">Dishwashing</h3>
              </div>
            </Card>
            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden group h-40 relative"
              onClick={() => handleServiceClick('Bathroom Cleaning')}
            >
              <img src="/src/assets/bathroom-cleaning.png" alt="Bathroom Cleaning" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 opacity-90" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center p-2 text-center">
                <h3 className="text-white font-bold text-lg leading-tight shadow-md">Bathroom<br />Cleaning</h3>
              </div>
            </Card>
            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden group h-40 relative"
              onClick={() => handleServiceClick('Kitchen Prep')}
            >
              <img src="/src/assets/kitchen-prep.png" alt="Kitchen Prep" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 opacity-90" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center p-2 text-center">
                <h3 className="text-white font-bold text-lg leading-tight shadow-md">Kitchen<br />Prep</h3>
              </div>
            </Card>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="mb-12 py-8 border-t border-b">
          <h2 className="text-2xl font-bold mb-8 text-center">Why Choose HelperHub?</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-4">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                <Badge className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold">Verified Professionals</h3>
              <p className="text-muted-foreground">Every helper undergoes a strict background check and skills assessment.</p>
            </div>
            <div className="space-y-4">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                <Clock className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold">On-Time Service</h3>
              <p className="text-muted-foreground">We value your time. Our professionals are punctual and efficient.</p>
            </div>
            <div className="space-y-4">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold">Quality Guarantee</h3>
              <p className="text-muted-foreground">Not satisfied? We will redo the service or offer a full refund.</p>
            </div>
          </div>
        </section>

        {/* Experts Nearby Map Visual */}
        <section className="mb-12" id="experts-section">
          <div className="bg-white rounded-3xl p-6 shadow-sm border mb-8">
            <h2 className="text-xl font-bold mb-4 text-center text-primary">
              {filteredHelpers.length} experts currently active around you
            </h2>

            {/* Mock Map Container */}
            <div className="relative w-full h-64 bg-slate-100 rounded-2xl overflow-hidden mb-6">
              {/* Map Background Pattern (CSS-based mock) */}
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)',
                backgroundSize: '20px 20px'
              }}></div>

              {/* Map Streets Mock (CSS) */}
              <div className="absolute top-1/4 left-0 w-full h-4 bg-white transform -rotate-6"></div>
              <div className="absolute top-0 right-1/3 w-4 h-full bg-white transform rotate-12"></div>
              <div className="absolute bottom-1/4 left-0 w-3/4 h-4 bg-white"></div>

              {/* Scattered Experts Icons (Mock positions) */}
              <div className="absolute top-1/3 left-1/4 animate-pulse">
                <div className="relative">
                  <div className="absolute -inset-2 bg-pink-500/20 rounded-full animate-ping"></div>
                  <div className="h-8 w-8 bg-pink-100 rounded-full flex items-center justify-center border-2 border-white shadow-md relative z-10">
                    <User className="h-4 w-4 text-pink-600" />
                  </div>
                </div>
              </div>
              <div className="absolute top-1/2 right-1/4 animate-pulse delay-75">
                <div className="relative">
                  <div className="absolute -inset-2 bg-pink-500/20 rounded-full animate-ping"></div>
                  <div className="h-8 w-8 bg-pink-100 rounded-full flex items-center justify-center border-2 border-white shadow-md relative z-10">
                    <User className="h-4 w-4 text-pink-600" />
                  </div>
                </div>
              </div>
              <div className="absolute bottom-1/3 left-1/2 animate-pulse delay-150">
                <div className="relative">
                  <div className="absolute -inset-2 bg-pink-500/20 rounded-full animate-ping"></div>
                  <div className="h-8 w-8 bg-pink-100 rounded-full flex items-center justify-center border-2 border-white shadow-md relative z-10">
                    <User className="h-4 w-4 text-pink-600" />
                  </div>
                </div>
              </div>
              <div className="absolute top-1/4 right-1/3 animate-pulse delay-300">
                <div className="relative">
                  <div className="absolute -inset-2 bg-pink-500/20 rounded-full animate-ping"></div>
                  <div className="h-8 w-8 bg-pink-100 rounded-full flex items-center justify-center border-2 border-white shadow-md relative z-10">
                    <User className="h-4 w-4 text-pink-600" />
                  </div>
                </div>
              </div>
            </div>

          </div>


          {/* Referral Banner */}
          <div className="bg-gradient-to-r from-purple-500 to-purple-400 rounded-2xl p-4 flex items-center justify-between text-white shadow-lg cursor-pointer hover:shadow-xl transition-shadow mb-12">
            <div className="flex items-center gap-4">
              <img src="/src/assets/referral-gift.png" alt="Gift" className="h-12 w-12 object-contain" />
              <div>
                <h3 className="font-bold text-lg">Refer a Friend</h3>
                <p className="text-purple-100 text-sm">Earn ₹150 for every referral</p>
              </div>
            </div>
            <div className="bg-white/20 p-2 rounded-full">
              <ArrowRight className="h-5 w-5 text-white" />
            </div>
          </div>
        </section>
        <section>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading helpers...</p>
            </div>
          ) : filteredHelpers.length === 0 ? (
            <></>
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
                          <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-1" title="Verified Expert">
                            <Sparkles className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg truncate">{helper.full_name}</CardTitle>
                          <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                            <MapPin className="h-3 w-3 mr-1 inline" />
                            0.8 km
                          </Badge>
                        </div>
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

      {/* Service Guidelines Dialog */}
      <Dialog open={showServiceGuidelines} onOpenChange={setShowServiceGuidelines}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{activeGuidelineService}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-600 flex items-center gap-2">
                <span className="bg-green-100 p-1 rounded-full"><ArrowRight className="h-3 w-3" /></span> Do's
              </h4>
              <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
                {(serviceGuidelines[activeGuidelineService]?.dos || ["Provide clear instructions."]).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-red-600 flex items-center gap-2">
                <span className="bg-red-100 p-1 rounded-full"><ArrowRight className="h-3 w-3" /></span> Don'ts
              </h4>
              <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
                {(serviceGuidelines[activeGuidelineService]?.donts || ["Don't interfere with the work process."]).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                className="flex-1"
                onClick={() => {
                  setShowServiceGuidelines(false);
                  setSelectedService(activeGuidelineService);
                  const element = document.getElementById('experts-section');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Book Now
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowServiceGuidelines(false);
                  setSelectedService(activeGuidelineService);
                  toast({ title: "Pre-booking", description: "Select an expert to schedule for later." });
                  const element = document.getElementById('experts-section');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Pre-book
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Duration Selection Dialog */}
      <Dialog open={showDurationDialog} onOpenChange={setShowDurationDialog}>
        <DialogContent className="max-w-md">
          <div className="py-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Select duration of service</h3>
              <span className="text-xs font-bold text-pink-500 bg-pink-50 px-2 py-1 rounded-full animate-pulse">
                Arriving in 15 Min
              </span>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
              {durationOptions.map((option, index) => {
                // Find the base price for the selected service or default to 200 if not found
                const service = services.find(s => s.name === activeGuidelineService);
                const basePrice = service ? service.base_price : 200;
                const totalPrice = Math.round(basePrice * option.multiplier);
                const originalPrice = Math.round(totalPrice * 1.6); // Fake original price for discount
                const discount = Math.round(((originalPrice - totalPrice) / originalPrice) * 100);

                return (
                  <div
                    key={option.label}
                    className="flex-shrink-0 w-40 snap-center border rounded-2xl p-4 flex flex-col items-center justify-between text-center relative overflow-hidden group hover:border-pink-500 transition-all cursor-pointer bg-white shadow-sm"
                  >
                    <div className="absolute top-0 inset-x-0 h-1 bg-gray-100 group-hover:bg-pink-500 transition-colors" />
                    <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px] font-bold mb-3 px-2 py-0.5 rounded-sm">
                      {discount}% OFF
                    </Badge>

                    <div className="mb-4">
                      <h4 className="text-xl font-bold text-slate-800 mb-1">{option.label}</h4>
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <span className="font-bold">₹{totalPrice}</span>
                        <span className="text-muted-foreground line-through text-xs">₹{originalPrice}</span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full border-pink-500 text-pink-600 hover:bg-pink-50 hover:text-pink-700 h-8 text-sm font-semibold rounded-lg"
                      onClick={() => {
                        setShowDurationDialog(false);
                        navigate('/payment', {
                          state: {
                            service: activeGuidelineService,
                            duration: option.hours,
                            label: option.label,
                            price: totalPrice,
                            rate: basePrice
                          }
                        });
                      }}
                    >
                      Book
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AIChatbot />
    </div >
  );
};

export default Dashboard;
