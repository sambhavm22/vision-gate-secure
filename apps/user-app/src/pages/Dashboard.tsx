import logo from "@/assets/helperhub-logo.png";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@vision-gate/supabase/client";
import { Database } from "@vision-gate/supabase/types";
import { format } from "date-fns";
import { ArrowLeft, ArrowRight, Calendar, Clock, Home, LogOut, MapPin, Moon, Sparkles, Star, Sun, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type Service = Database['public']['Tables']['services']['Row'];
type Worker = Database['public']['Tables']['workers_public']['Row'];

interface Helper extends Worker {
  dist_meters?: number;
  // UI helpers
  city?: string;
  experience_years?: number;
  service_type?: string;
  verified?: boolean;
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
  // Availability simplified: assume available
  const [showAvailability, setShowAvailability] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingLocation, setBookingLocation] = useState("");
  const [showServiceGuidelines, setShowServiceGuidelines] = useState(false);
  const [activeGuidelineService, setActiveGuidelineService] = useState<string>("");
  const [showDurationDialog, setShowDurationDialog] = useState(false);
  const [showServiceSelector, setShowServiceSelector] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [userLocation, setUserLocation] = useState("Mumbai, India");
  const [manualLocationInput, setManualLocationInput] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [showCustomDuration, setShowCustomDuration] = useState(false);
  const [customHours, setCustomHours] = useState<number | "">("");

  // Pre-booking State
  const [showPrebookDialog, setShowPrebookDialog] = useState(false);
  const [prebookDate, setPrebookDate] = useState<Date | undefined>(new Date());
  const [prebookTime, setPrebookTime] = useState("10:00");
  const [prebookDuration, setPrebookDuration] = useState(2);
  const [prebookType, setPrebookType] = useState<"single" | "multiple">("single");
  const [selectedWeekDays, setSelectedWeekDays] = useState<string[]>([]);
  const [prebookEndDate, setPrebookEndDate] = useState<Date | undefined>(undefined);

  const [showReferralDialog, setShowReferralDialog] = useState(false);



  // Default coordinates (Mumbai) for testing geospatial search
  const userLat = 19.0760;
  const userLng = 72.8777;

  const durationOptions = [
    { label: "1 hr", hours: 1, multiplier: 1 },
    { label: "1.5 hrs", hours: 1.5, multiplier: 1.5 },
    { label: "2 hrs", hours: 2, multiplier: 2 },
    { label: "3 hrs", hours: 3, multiplier: 3 },
  ];

  const serviceGuidelines: Record<string, { dos: string[]; donts: string[] }> = {
    // ... (Keeping existing guidelines map as is for now) ...
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
      // Optional: Redirect to login or just show public data
      // navigate("/login");
    }
  };

  /* 
   * FIX: `data` from Supabase select queries can be inferred as a generic array if not strongly typed via generics or type assertions.
   * `Service` type from DB definition includes `is_active`, but frontend `Service` interface might need it.
   * Adding explicit type checks or mapping to ensure UI stability.
   */
  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select(`
            id,
            name,
            description,
            base_price,
            image_url,
            is_active,
            created_at
        `) // Explicitly selecting fields to match type
        .eq('is_active', true)
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

      // Use RPC for nearby workers
      // We explicitly cast the response or use `any` temporarily if RPC types are not fully generated yet
      const { data, error } = await supabase
        .rpc('nearby_workers', {
          lat: userLat,
          lng: userLng,
          radius_meters: 50000,
          service_filter: null // Add missing optional arg if strict
        } as any); // Cast args if TS complains about overload

      if (error) {
        console.error("RPC Error, falling back to simple select:", error);
        // Fallback
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("workers_public")
          .select("*")
          .order("rating", { ascending: false });

        if (fallbackError) throw fallbackError;
        setHelpers((fallbackData || []).map(w => ({
          ...w,
          service_types: w.service_types || [],
          service_type: w.service_types?.[0] || 'Helper', // UI compat
          verified: w.is_verified,
          city: 'Mumbai',
          experience_years: 5
        })));
      } else {
        // Map RPC results
        setHelpers((data || []).map((h: any) => ({
          ...h,
          // Ensure compatibility with Helper interfcae
          id: h.id,
          full_name: h.full_name,
          rating: h.rating,
          hourly_rate: h.hourly_rate,
          profile_image_url: h.profile_image_url,
          // Fields potentially missing from RPC return, add defaults
          service_types: h.service_types || [], // Check if RPC returns this!
          total_reviews: h.total_reviews || 0,
          is_verified: h.is_verified,
          bio: h.bio || '',
          created_at: h.created_at || new Date().toISOString(),

          // UI Mappings
          service_type: h.service_types?.[0] || 'Helper',
          verified: h.is_verified,
          city: 'Mumbai',
          experience_years: 5
        })));
      }
    } catch (error) {
      console.error("Error fetching helpers:", error);
      toast({
        title: "Error",
        description: "Failed to load experts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleServiceClick = (serviceName: string) => {
    setActiveGuidelineService(serviceName);
    setShowServiceGuidelines(true);
  };

  const handleHelperClick = async (helper: Helper) => {
    setSelectedHelper(helper);
    setShowAvailability(true);
    // Availability assumed
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

      // Use create_booking RPC for better security/validation if possible, 
      // but sticking to direct insert as per previous code attempt to fix types first.
      // Ideally: const { error } = await supabase.rpc('create_booking', { ... });

      const { error } = await supabase.from("bookings").insert({
        customer_id: session.user.id,
        worker_id: selectedHelper.id,
        service_id: 1, // Placeholder: need to look up ID based on service name
        scheduled_at: new Date(`${bookingDate}T${bookingTime}`).toISOString(),
        address_id: null, // Using text location for now which is not in schema directly? 
        // Schema requires address_id OR likely we should create address first.
        // For simplify, we will skip address creation and rely on notes? 
        // Wait, schema enforces address_id? "address_id uuid references public.addresses(id)" - nullable?
        // Checking schema: "address_id uuid references public.addresses(id)" is NOT NULL? No, it's nullable in my create table script.

        // Storing location in notes since `bookings` table doesn't have `location` text column, only `address_id`
        notes: `Location: ${bookingLocation}`,

        total_amount: selectedHelper.hourly_rate,
        status: "requested",
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
        (helper.service_types && helper.service_types.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
      const matchesService = selectedService === "all" || (helper.service_types && helper.service_types.includes(selectedService));
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

          <div
            className="flex items-center gap-4 hidden md:flex text-sm text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full cursor-pointer hover:bg-secondary/70 transition-colors"
            onClick={() => setShowLocationDialog(true)}
          >
            <MapPin className="h-4 w-4 text-primary" />
            <span>Current Location: <span className="font-medium text-foreground">{userLocation}</span></span>
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
        <div
          className="md:hidden flex items-center gap-2 mb-6 text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg cursor-pointer hover:bg-secondary/70 active:bg-secondary/80 transition-colors"
          onClick={() => setShowLocationDialog(true)}
        >
          <MapPin className="h-4 w-4 text-primary" />
          <span>Current Location: <span className="font-medium text-foreground">{userLocation}</span></span>
        </div>

        {/* Hero / Offers Section */}
        <section className="mb-12">
          <div className="grid md:grid-cols-2 gap-6 items-center bg-gradient-to-r from-primary/10 to-secondary/10 p-8 rounded-3xl">
            <div>
              <Badge className="mb-4" variant="secondary">Special Offer</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary">Get 20% Off <br /><span className="text-foreground">On Your First Booking</span></h1>
              <p className="text-muted-foreground text-lg mb-6">Experience top-rated service professionals at unbeatable prices. Valid for all new users this month.</p>
              <Button
                size="lg"
                className="rounded-full px-8"
                onClick={() => setShowServiceSelector(true)}
              >
                Book Now
              </Button>
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
              <img src="/src/assets/cleaning-service-premium.png" alt="Everyday Cleaning" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <h3 className="text-white text-2xl font-bold">Everyday<br />Cleaning</h3>
              </div>
            </Card>
            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden group h-64 relative"
              onClick={() => handleServiceClick('Weekly Cleaning')}
            >
              <img src="/src/assets/weekly-cleaning-service.jpg" alt="Weekly Cleaning" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
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


          <div
            className="bg-gradient-to-r from-purple-500 to-purple-400 rounded-2xl p-4 flex items-center justify-between text-white shadow-lg cursor-pointer hover:shadow-xl transition-shadow mb-12"
            onClick={() => setShowReferralDialog(true)}
          >
            <div className="flex items-center gap-4">
              <img src="/src/assets/referral-gift-box.png" alt="Gift" className="h-12 w-12 object-contain" />
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

                {/* Availability removed as per plan */}

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
                  setShowDurationDialog(true);
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
                  setShowPrebookDialog(true);
                }}
              >
                Pre-book
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Location Selection Dialog */}
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Select Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Button
              className="w-full justify-start h-12 text-base font-normal shadow-sm border"
              variant="outline"
              onClick={() => {
                setIsLocating(true);
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    async (position) => {
                      try {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;

                        // User OpenStreetMap Nominatim for free reverse geocoding
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                        const data = await response.json();

                        if (data && data.address) {
                          const area = data.address.suburb || data.address.neighbourhood || data.address.residential || data.address.road || "Unknown Area";
                          const city = data.address.city || data.address.town || data.address.village || data.address.state_district || "Unknown City";

                          setUserLocation(`${area}, ${city}`);
                          toast({ title: "Location Updated", description: `Detected: ${area}, ${city}` });
                        } else {
                          // Fallback to coordinates if address not found
                          setUserLocation(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
                          toast({ title: "Location Updated", description: "Could not fetch address details." });
                        }
                      } catch (error) {
                        console.error("Reverse geocoding error:", error);
                        // Fallback to coordinates on error
                        setUserLocation(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
                        toast({ title: "Warning", description: "Could not fetch address name." });
                      } finally {
                        setShowLocationDialog(false);
                        setIsLocating(false);
                      }
                    },
                    (error) => {
                      console.error(error);
                      toast({ title: "Error", description: "Could not access location.", variant: "destructive" });
                      setIsLocating(false);
                    }
                  );
                } else {
                  toast({ title: "Error", description: "Geolocation not supported.", variant: "destructive" });
                  setIsLocating(false);
                }
              }}
              disabled={isLocating}
            >
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 text-blue-600">
                <MapPin className="h-4 w-4" />
              </div>
              {isLocating ? "Locating..." : "Use Current Location"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or enter manually</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Enter city or area"
                value={manualLocationInput}
                onChange={(e) => setManualLocationInput(e.target.value)}
              />
              <Button
                onClick={() => {
                  if (manualLocationInput.trim()) {
                    setUserLocation(manualLocationInput);
                    setShowLocationDialog(false);
                    toast({ title: "Location Updated", description: `Location set to ${manualLocationInput}` });
                  }
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Referral Dialog */}
      <Dialog open={showReferralDialog} onOpenChange={setShowReferralDialog}>
        <DialogContent className="max-w-sm p-0 overflow-hidden bg-gradient-to-br from-purple-600 to-indigo-600 border-none text-white">
          <div className="relative">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
              <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
              <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-400/20 rounded-full blur-xl"></div>
            </div>

            <div className="relative z-10 p-6 flex flex-col items-center text-center">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 left-2 text-white/80 hover:bg-white/10 hover:text-white"
                onClick={() => setShowReferralDialog(false)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="absolute top-2 right-2">
                <div className="h-6 w-6 rounded-full border border-white/40 flex items-center justify-center text-xs font-bold text-white cursor-pointer">?</div>
              </div>

              <h2 className="text-2xl font-bold mt-4 mb-1">Refer and Earn!</h2>
              <p className="text-purple-100 text-xs mb-6">Live in Bangalore, Mumbai, and more</p>

              <div className="mb-8 relative w-48 h-48 flex items-center justify-center">
                {/* Glowing effect behind image */}
                <div className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full animate-pulse"></div>
                <img
                  src="/src/assets/referral-gift-box.png"
                  alt="Gift Box"
                  className="w-40 h-40 object-contain drop-shadow-2xl z-10 hover:scale-105 transition-transform duration-500"
                />

                {/* Floating Coins (CSS Mock) */}
                <div className="absolute top-0 right-10 text-yellow-300 animate-bounce delay-700">
                  <div className="w-4 h-4 rounded-full bg-yellow-400 border-2 border-yellow-200 shadow-lg"></div>
                </div>
                <div className="absolute bottom-10 left-4 text-yellow-300 animate-bounce delay-300">
                  <div className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-200 shadow-lg"></div>
                </div>
                <div className="absolute top-1/2 right-0 text-yellow-300 animate-bounce">
                  <div className="w-5 h-5 rounded-full bg-yellow-400 border-2 border-yellow-200 shadow-lg"></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full mb-6">
                <div className="bg-white rounded-2xl p-4 text-center shadow-lg transform transition-transform hover:-translate-y-1">
                  <p className="text-xs text-gray-500 font-medium mb-1">They get</p>
                  <p className="text-2xl font-black text-green-600">₹50</p>
                  <p className="text-[10px] text-gray-400">On Sign Up</p>
                </div>
                <div className="bg-white rounded-2xl p-4 text-center shadow-lg transform transition-transform hover:-translate-y-1">
                  <p className="text-xs text-gray-500 font-medium mb-1">You get</p>
                  <p className="text-2xl font-black text-green-600">₹150</p>
                  <p className="text-[10px] text-gray-400">For Referring</p>
                </div>
              </div>

              <Button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-6 rounded-xl shadow-xl shadow-green-900/20 text-lg group">
                Refer & Earn ₹150
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Service Selector Dialog */}
      <Dialog open={showServiceSelector} onOpenChange={setShowServiceSelector}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">Which service do you need?</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {[
              "Everyday Cleaning",
              "Weekly Cleaning",
              "Laundry",
              "Dishwashing",
              "Bathroom Cleaning",
              "Kitchen Prep"
            ].map((service) => (
              <div
                key={service}
                className="flex flex-col items-center justify-center p-4 border rounded-xl hover:border-primary hover:bg-primary/5 cursor-pointer transition-all gap-2 text-center h-32"
                onClick={() => {
                  setShowServiceSelector(false);
                  handleServiceClick(service);
                }}
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {service.includes("Cleaning") ? <Sparkles className="h-6 w-6" /> :
                    service.includes("Laundry") ? <div className="h-6 w-6 border-2 border-current rounded-sm" /> :
                      service.includes("Dishwashing") ? <div className="h-6 w-6 rounded-full border-b-2 border-current" /> :
                        <Star className="h-6 w-6" />}
                </div>
                <span className="font-medium text-sm">{service}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Duration Selection Dialog */}
      <Dialog open={showDurationDialog} onOpenChange={setShowDurationDialog}>
        <DialogContent className="max-w-3xl">
          <div className="py-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-xl">Select duration of service</h3>
              <span className="text-xs font-bold text-pink-500 bg-pink-50 px-3 py-1.5 rounded-full animate-pulse">
                Arriving in 15 Min
              </span>
            </div>
            {/* Grid Layout Fix */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                    className="border rounded-2xl p-4 flex flex-col items-center justify-between text-center relative overflow-hidden group hover:border-pink-500 transition-all cursor-pointer bg-white shadow-sm h-full"
                  >
                    <div className="absolute top-0 inset-x-0 h-1 bg-gray-100 group-hover:bg-pink-500 transition-colors" />
                    <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px] font-bold mb-3 px-2 py-0.5 rounded-sm">
                      {discount}% OFF
                    </Badge>

                    <div className="mb-4 space-y-1 w-full">
                      <h4 className="text-2xl font-black text-slate-800">{option.label}</h4>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="font-extrabold text-lg">₹{totalPrice}</span>
                        <span className="text-muted-foreground line-through text-xs decoration-slate-400">₹{originalPrice}</span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full border-pink-500 text-pink-600 hover:bg-pink-50 hover:text-pink-700 h-9 text-base font-bold rounded-xl border-2"
                      onClick={() => {
                        setShowDurationDialog(false);
                        navigate('/payment', {
                          state: {
                            service: activeGuidelineService,
                            service_id: service?.id, // Pass ID for backend
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

            {/* Custom Duration Section */}
            <div className="mt-6 pt-4 border-t">
              <button
                className="w-full text-center text-sm font-medium text-pink-600 hover:text-pink-700 hover:underline flex items-center justify-center gap-1 mb-4"
                onClick={() => setShowCustomDuration(!showCustomDuration)}
              >
                Need service for longer? Book for a Full Day or Custom hours
              </button>

              {showCustomDuration && (
                <div className="bg-slate-50 rounded-xl p-4 animate-in slide-in-from-top-2 fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Full Day Card */}
                    <div
                      className="bg-white border-2 border-slate-200 hover:border-pink-500 rounded-xl p-3 cursor-pointer transition-all flex flex-col items-center justify-center text-center shadow-sm"
                      onClick={() => {
                        const service = services.find(s => s.name === activeGuidelineService);
                        const basePrice = service ? service.base_price : 200;
                        const duration = 8;
                        const totalPrice = Math.round(basePrice * duration * 0.9); // 10% discount for full day

                        setShowDurationDialog(false);
                        navigate('/payment', {
                          state: {
                            service: activeGuidelineService,
                            service_id: service?.id,
                            duration: duration,
                            label: "Full Day (8 Hrs)",
                            price: totalPrice,
                            rate: basePrice
                          }
                        });
                      }}
                    >
                      <h5 className="font-bold text-lg text-slate-800">Full Day</h5>
                      <span className="text-xs text-muted-foreground mb-2">8 Hours (+Break)</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px] uppercase">10% OFF</Badge>
                    </div>

                    {/* Custom Hours Input */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="Hrs"
                          min={4}
                          max={12}
                          className="h-10 text-center font-bold"
                          value={customHours}
                          onChange={(e) => setCustomHours(Number(e.target.value))}
                        />
                        <span className="text-sm font-medium">Hours</span>
                      </div>
                      <Button
                        size="sm"
                        disabled={!customHours || Number(customHours) < 4}
                        onClick={() => {
                          if (!customHours) return;
                          const service = services.find(s => s.name === activeGuidelineService);
                          const basePrice = service ? service.base_price : 200;
                          const totalPrice = Math.round(basePrice * Number(customHours));

                          setShowDurationDialog(false);
                          navigate('/payment', {
                            state: {
                              service: activeGuidelineService,
                              service_id: service?.id,
                              duration: Number(customHours),
                              label: `${customHours} Hrs`,
                              price: totalPrice,
                              rate: basePrice
                            }
                          });
                        }}
                      >
                        Book Custom
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pre-booking Dialog */}
      <Dialog open={showPrebookDialog} onOpenChange={setShowPrebookDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule your Service</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="single" value={prebookType} onValueChange={(v) => setPrebookType(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Single Service</TabsTrigger>
              <TabsTrigger value="multiple">Recurring / Multiple</TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-4 py-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-2">
                  <span className="text-sm font-semibold mb-2 block px-2">Select Date</span>
                  <CalendarComponent
                    mode="single"
                    selected={prebookDate}
                    onSelect={setPrebookDate}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border-0"
                  />
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Time</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"].map(time => (
                        <Button
                          key={time}
                          variant={prebookTime === time ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPrebookTime(time)}
                          className={prebookTime === time ? "bg-pink-600 hover:bg-pink-700" : ""}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Duration (Hours)</label>
                    <div className="flex items-center gap-4">
                      <Button variant="outline" size="icon" onClick={() => setPrebookDuration(Math.max(1, prebookDuration - 0.5))}>-</Button>
                      <span className="font-bold text-lg w-12 text-center">{prebookDuration}</span>
                      <Button variant="outline" size="icon" onClick={() => setPrebookDuration(Math.min(12, prebookDuration + 0.5))}>+</Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selected Schedule Summary */}
              <div className="bg-pink-50 border border-pink-100 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Selected Schedule</p>
                    <p className="font-bold text-slate-800">
                      {prebookDate ? format(prebookDate, "EEE, dd MMM") : "Select Date"} at {prebookTime}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-medium">Duration</p>
                  <p className="font-bold text-slate-800">{prebookDuration} Hrs</p>
                </div>
              </div>

              <Button
                className="w-full mt-4 bg-slate-900 hover:bg-pink-600"
                onClick={() => {
                  if (!prebookDate) return;
                  const dateStr = format(prebookDate, "yyyy-MM-dd");

                  const service = services.find(s => s.name === activeGuidelineService);
                  // Navigate to logic similar to immediate booking but with Scheduled flag
                  setShowPrebookDialog(false);

                  // For demo, we might want to go to expert selection or payment. 
                  // If "Pre-book" means select expert first, we go to experts.
                  // But usually scheduling implies confirming schedule. 
                  // Let's assume we go to Payment/Summary with scheduled details.

                  // Calculate dummy price
                  const basePrice = service ? service.base_price : 200;
                  const totalPrice = Math.round(basePrice * prebookDuration);

                  navigate('/payment', {
                    state: {
                      service: activeGuidelineService,
                      service_id: service?.id,
                      duration: prebookDuration,
                      label: `${prebookDuration} Hrs (Scheduled)`,
                      price: totalPrice,
                      rate: basePrice,
                      scheduledDate: dateStr,
                      scheduledTime: prebookTime,
                      isPrebook: true
                    }
                  });
                }}
              >
                Proceed with Schedule
              </Button>
            </TabsContent>

            <TabsContent value="multiple" className="space-y-4 py-4">
              <div className="bg-card/50 p-4 rounded-lg border">
                <h4 className="font-medium mb-4 text-foreground">Select Recurring Days</h4>
                <div className="flex flex-wrap gap-2 mb-6">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                    <div
                      key={day}
                      className={`h-10 w-10 rounded-full flex items-center justify-center cursor-pointer border transition-all ${selectedWeekDays.includes(day)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:border-primary/50'
                        }`}
                      onClick={() => {
                        if (selectedWeekDays.includes(day)) {
                          setSelectedWeekDays(selectedWeekDays.filter(d => d !== day));
                        } else {
                          setSelectedWeekDays([...selectedWeekDays, day]);
                        }
                      }}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Start Date</label>
                    <Input type="date" className="bg-background text-foreground" value={prebookDate ? format(prebookDate, 'yyyy-MM-dd') : ''} onChange={e => setPrebookDate(e.target.value ? new Date(e.target.value) : undefined)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">End Date</label>
                    <Input type="date" className="bg-background text-foreground" value={prebookEndDate ? format(prebookEndDate, 'yyyy-MM-dd') : ''} onChange={e => setPrebookEndDate(e.target.value ? new Date(e.target.value) : undefined)} />
                  </div>
                </div>

                {/* Time Picker */}
                <div className="space-y-2 mb-6">
                  <label className="text-sm font-medium text-foreground">Preferred Time</label>
                  <Input
                    type="time"
                    value={prebookTime}
                    onChange={(e) => setPrebookTime(e.target.value)}
                    className="bg-background text-foreground"
                  />
                </div>

                {/* Duration Selector */}
                <div className="space-y-2 mb-6">
                  <label className="text-sm font-medium text-foreground">Duration (Hours)</label>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setPrebookDuration(Math.max(1, prebookDuration - 0.5))}>-</Button>
                    <span className="font-bold text-lg w-12 text-center">{prebookDuration}</span>
                    <Button variant="outline" size="icon" onClick={() => setPrebookDuration(Math.min(12, prebookDuration + 0.5))}>+</Button>
                  </div>
                </div>

                {/* Schedule Summary */}
                <div className="bg-muted/50 border border-muted rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Selected Schedule</p>
                      <p className="font-bold text-foreground">
                        {selectedWeekDays.length > 0 ? selectedWeekDays.join(', ') : 'Select days'}
                        {prebookDate ? ` from ${format(prebookDate, 'EEE, dd MMM')}` : ''} to {prebookEndDate ? ` ${format(prebookEndDate, 'EEE, dd MMM')}` : ''} at {prebookTime || 'Select time'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground font-medium">Duration</p>
                    <p className="font-bold text-foreground">{prebookDuration} Hrs</p>
                  </div>
                </div>

                <Button
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={selectedWeekDays.length === 0}
                  onClick={() => {
                    // Placeholder for recurring booking handling
                    toast({ title: "Feature Pending", description: "Recurring booking backend is under construction." });
                  }}
                >
                  Configure Recurring Plan
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

    </div >
  );
};

export default Dashboard;