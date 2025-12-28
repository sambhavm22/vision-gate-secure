import { BookingCard } from "@/components/BookingCard";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@vision-gate/supabase/client";
import { Button, Card, CardContent, CardHeader, CardTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tabs, TabsContent, TabsList, TabsTrigger, useToast } from "@vision-gate/ui";
import { Briefcase, CalendarClock, Loader2, MapPin, MapPinOff, Moon, RefreshCw, Star, Sun, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
    const { workerProfile } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { t } = useTranslation();
    const [marketBookings, setMarketBookings] = useState<any[]>([]);
    const [myBookings, setMyBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [currentLocationName, setCurrentLocationName] = useState(t('common.loading'));
    const [isLocating, setIsLocating] = useState(false);

    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem("worker-darkMode") === "true";
    });

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
        localStorage.setItem("worker-darkMode", darkMode.toString());
    }, [darkMode]);

    // State for filters
    const [sortBy, setSortBy] = useState("date-asc");
    const [filterService, setFilterService] = useState("all");
    const [filterDistance, setFilterDistance] = useState(50); // Default 50km

    // Get unique services
    const uniqueServices = Array.from(new Set(marketBookings.map(b => b.service_name).filter(Boolean)));

    // Filter and Sort Logic
    const filteredBookings = marketBookings
        .filter(b => filterService === "all" || b.service_name === filterService)
        .filter(b => {
            if (b.dist_meters === null || b.dist_meters === undefined) return true;
            const distanceKm = b.dist_meters / 1000;
            if (filterDistance >= 1000) return true;
            return distanceKm <= filterDistance;
        })
        .sort((a, b) => {
            if (sortBy === 'date-asc') return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
            if (sortBy === 'date-desc') return new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime();
            if (sortBy === 'dist-asc') return (a.dist_meters || Infinity) - (b.dist_meters || Infinity);
            return 0;
        });

    useEffect(() => {
        // Init location from storage if available
        const storedLocName = localStorage.getItem("workerLocationName");
        if (storedLocName) {
            setCurrentLocationName(storedLocName);
        }
        detectLocation();
    }, [workerProfile]);

    const detectLocation = () => {
        setIsLocating(true);
        if (!navigator.geolocation) {
            setCurrentLocationName("Location not supported");
            setIsLocating(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    // Reverse Geocoding
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    const area = data.address.suburb || data.address.neighbourhood || data.address.city_district;
                    const city = data.address.city || data.address.town || data.address.village;
                    const locName = `${area ? area + ", " : ""}${city || "Unknown Location"}`;

                    setCurrentLocationName(locName);
                    localStorage.setItem("workerLocationName", locName);

                    // Update worker location in DB
                    if (workerProfile) {
                        const { error } = await (supabase
                            .from("workers_public") as any)
                            .update({
                                location: `POINT(${longitude} ${latitude})`
                            })
                            .eq("id", workerProfile.id);

                        if (error) {
                            console.error("Failed to update worker location:", error);
                        }
                    }
                } catch (error) {
                    console.error("Geocoding failed:", error);
                    setCurrentLocationName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                } finally {
                    setIsLocating(false);
                }
            },
            (error) => {
                console.error("Geolocation error:", error);

                // Only reset if we don't have a stored location
                if (!localStorage.getItem("workerLocationName")) {
                    setCurrentLocationName("Mumbai (Default)");
                }

                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const fetchBookings = async () => {
        if (!workerProfile) return;
        setIsLoading(true);
        try {
            // 1. Fetch Market Bookings (RPC)
            // Using v2 to avoid ambiguity
            const { data: marketData, error: marketError } = await supabase.rpc(
                "get_market_bookings_v2",
                {
                    p_worker_id: workerProfile.id,
                    p_limit: 50,
                    p_radius_km: 100
                } as any
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
            toast({ variant: "destructive", title: t('dashboard.toasts.fetch_error'), description: error.message });
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();

        // Realtime Subscription
        const channel = supabase
            .channel('public:bookings')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'bookings' },
                (_payload) => {
                    // Refresh bookings on any change (simple invalidation strategy)
                    fetchBookings();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
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
                title: t('dashboard.toasts.booking_accepted'),
                description: t('dashboard.toasts.accepted_success'),
            });

            // Refresh list
            await fetchBookings();
        } catch (error: any) {
            toast({ variant: "destructive", title: t('dashboard.toasts.accept_failed'), description: error.message });
        } finally {
            setProcessingId(null);
        }
    };

    const handleCancel = async (bookingId: string) => {
        if (!workerProfile) return;
        if (!confirm("Are you sure you want to cancel this booking?")) return;
        setProcessingId(bookingId);
        try {
            const { error } = await supabase
                .from("bookings")
                // @ts-ignore
                .update({ status: 'requested', worker_id: null })
                .eq("id", bookingId)
                .eq("worker_id", workerProfile.id); // Security check

            if (error) throw error;

            toast({ title: t('dashboard.toasts.booking_cancelled'), description: t('dashboard.toasts.cancelled_success') });
            await fetchBookings();
        } catch (error: any) {
            toast({ variant: "destructive", title: t('common.error'), description: error.message });
        } finally {
            setProcessingId(null);
        }
    };

    if (!workerProfile) return null;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="bg-card border-b sticky top-0 z-10 px-6 py-4 flex justify-between items-center shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        {t('app_name')}
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <LanguageToggle />
                    <div
                        className="hidden md:flex items-center gap-2 text-sm text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-800 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                        onClick={detectLocation}
                        title="Click to refresh location"
                    >
                        <MapPin className={`h-4 w-4 ${isLocating ? 'animate-pulse' : ''}`} />
                        <span>{t('dashboard.current_location')}: {currentLocationName}</span>
                    </div>
                    <div className="text-sm font-medium text-gray-700 hidden sm:inline-block dark:text-gray-200">
                        {workerProfile.full_name}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDarkMode(!darkMode)}
                        className="rounded-full h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                        title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {darkMode ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4 text-slate-700" />}
                    </Button>
                    <div
                        className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold cursor-pointer hover:bg-primary/20 transition-colors"
                        onClick={() => navigate("/profile")}
                    >
                        {workerProfile.full_name?.charAt(0)}
                    </div>
                </div>
            </div>

            <div className="container mx-auto max-w-5xl py-8 px-4 space-y-8">
                {/* Welcome Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="w-full md:w-auto">
                        <h2 className="text-3xl font-bold tracking-tight">{t('dashboard.dashboard.welcome', 'Dashboard')}</h2>
                        <p className="text-muted-foreground mt-1">
                            {t('dashboard.subtitle')}
                        </p>
                        {/* Mobile Location */}
                        <div
                            className="mt-4 md:hidden flex items-center gap-2 text-sm text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-800 w-fit cursor-pointer"
                            onClick={detectLocation}
                        >
                            <MapPin className={`h-4 w-4 ${isLocating ? 'animate-pulse' : ''}`} />
                            <span>{t('dashboard.current_location')}: {currentLocationName}</span>
                        </div>
                    </div>
                    <Button onClick={fetchBookings} disabled={isLoading} className="shadow-sm">
                        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        {t('dashboard.refresh_feed')}
                    </Button>
                </div>

                {/* Stats Overview */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="hover:shadow-md transition-all duration-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('dashboard.stats.total_jobs')}</CardTitle>
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{myBookings.length}</div>
                            <p className="text-xs text-muted-foreground">{t('dashboard.stats.scheduled_bookings')}</p>
                        </CardContent>
                    </Card>
                    <Card className="hover:shadow-md transition-all duration-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('dashboard.stats.rating')}</CardTitle>
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{workerProfile.rating?.toFixed(1) || "New"}</div>
                            <p className="text-xs text-muted-foreground">{t('dashboard.stats.avg_rating')}</p>
                        </CardContent>
                    </Card>
                    <Card className="hover:shadow-md transition-all duration-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('dashboard.stats.active_status')}</CardTitle>
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{t('dashboard.online')}</div>
                            <p className="text-xs text-muted-foreground">{t('dashboard.stats.visible_customer')}</p>
                        </CardContent>
                    </Card>
                    <Card className="hover:shadow-md transition-all duration-200 bg-primary/5 dark:bg-primary/10 border-primary/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-primary">{t('dashboard.stats.new_opps')}</CardTitle>
                            <TrendingUp className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary">{marketBookings.length}</div>
                            <p className="text-xs text-primary/80">{t('dashboard.stats.jobs_nearby')}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Tabs */}
                <Tabs defaultValue="marketplace" className="w-full">
                    <TabsList className="grid w-full md:w-[400px] grid-cols-2 mb-6">
                        <TabsTrigger value="marketplace">{t('dashboard.tabs.new_requests')} ({marketBookings.length})</TabsTrigger>
                        <TabsTrigger value="my-jobs">{t('dashboard.tabs.my_schedule')} ({myBookings.length})</TabsTrigger>
                    </TabsList>


                    <TabsContent value="marketplace" className="space-y-4 min-h-[300px]">
                        {/* Filter and Sort UI */}
                        <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-card rounded-lg border shadow-sm">
                            <div className="w-full md:w-1/3 space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t('dashboard.filter.sort_by')}</label>
                                <Select onValueChange={setSortBy} defaultValue={sortBy}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('dashboard.filter.sort_placeholder')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="date-asc">{t('dashboard.filter.sort_date_asc')}</SelectItem>
                                        <SelectItem value="date-desc">{t('dashboard.filter.sort_date_desc')}</SelectItem>
                                        <SelectItem value="dist-asc">{t('dashboard.filter.sort_dist_asc')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-full md:w-1/3 space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t('dashboard.filter.service_type')}</label>
                                <Select onValueChange={setFilterService} defaultValue={filterService}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('dashboard.filter.filter_placeholder')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('dashboard.filter.all_services')}</SelectItem>
                                        {uniqueServices.map((s: any) => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-full md:w-1/3 space-y-2">
                                <div className="flex justify-between">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t('dashboard.filter.distance_range')}</label>
                                    <span className="text-xs text-muted-foreground">{filterDistance} km</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="1000"
                                    step="10"
                                    value={filterDistance}
                                    onChange={(e) => setFilterDistance(Number(e.target.value))}
                                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>1 km</span>
                                    <span>1000+ km</span>
                                </div>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center p-12 text-gray-400 space-y-4">
                                <Loader2 className="h-8 w-8 animate-spin" />
                                <p>{t('dashboard.filter.finding_jobs')}</p>
                            </div>
                        ) : filteredBookings.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-muted/30 text-center">
                                <div className="p-4 rounded-full bg-muted mb-4">
                                    <MapPinOff className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold">{t('dashboard.filter.no_matching')}</h3>
                                <p className="text-muted-foreground max-w-sm mt-1">
                                    {t('dashboard.filter.adjust_filters')}
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                                {filteredBookings.map((booking: any) => (
                                    <BookingCard
                                        key={booking.booking_id || booking.id}
                                        booking={booking}
                                        type="marketplace"
                                        onAccept={handleAccept}
                                        isProcessing={processingId === (booking.booking_id || booking.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>


                    <TabsContent value="my-jobs" className="space-y-4 min-h-[300px]">
                        {isLoading ? (
                            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
                        ) : myBookings.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-muted/30 text-center">
                                <CalendarClock className="h-10 w-10 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold">{t('dashboard.filter.no_upcoming')}</h3>
                                <p className="text-muted-foreground">{t('dashboard.filter.schedule_clear')}</p>
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
