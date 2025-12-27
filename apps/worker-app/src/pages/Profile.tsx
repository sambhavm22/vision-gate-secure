import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea, useToast } from "@vision-gate/ui";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@vision-gate/supabase/client";
import { ArrowLeft, CheckCircle, Loader2, LogOut, MapPin, Moon, Save, ShieldAlert, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
    const navigate = useNavigate();
    const { workerProfile, refreshProfile } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [locationName, setLocationName] = useState("Not set");


    const [formData, setFormData] = useState({
        full_name: "",
        bio: "",
        hourly_rate: 0,
    });

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

    useEffect(() => {
        if (workerProfile) {
            setFormData({
                full_name: workerProfile.full_name || "",
                bio: workerProfile.bio || "",
                hourly_rate: workerProfile.hourly_rate || 0,
            });
            // Try to geocode current saved location if it exists
            if ((workerProfile as any).location) {
                // Simplified location display
                setLocationName("Custom Location Set");
            }
        }
    }, [workerProfile]);

    const handleSave = async () => {
        if (!workerProfile) return;
        setLoading(true);
        try {
            const { error } = await (supabase
                .from("workers_public") as any)
                .update({
                    full_name: formData.full_name,
                    bio: formData.bio,
                    hourly_rate: formData.hourly_rate,
                })
                .eq("id", workerProfile.id);

            if (error) throw error;

            toast({ title: "Profile Updated", description: "Changes saved successfully." });
            await refreshProfile();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Update Failed", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const initiateVerification = async () => {
        setLoading(true);
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token;

            // Adjust to use invocation or fetch
            const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-identity/initiate`;

            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to initiate verification');
            }

            const { url } = await response.json();
            if (url) {
                // Redirect to DigiLocker (or Mock)
                window.location.href = url;
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
            setLoading(false);
        }
    };

    const updateLocation = () => {
        setIsLocating(true);
        if (!navigator.geolocation) {
            toast({ variant: "destructive", title: "Error", description: "Geolocation not supported" });
            setIsLocating(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    // Update DB with PostGIS point
                    const { error } = await (supabase
                        .from("workers_public") as any)
                        // @ts-ignore - Supabase types for geography can be tricky
                        .update({
                            location: `POINT(${longitude} ${latitude})`
                        } as any)
                        .eq("id", workerProfile?.id);

                    if (error) throw error;

                    // Get readable name
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    const area = data.address.suburb || data.address.neighbourhood || data.address.city_district || data.address.city;
                    setLocationName(area || "Location Updated");

                    toast({ title: "Location Updated", description: `Service area set to ${area || "current position"}` });
                    await refreshProfile();
                } catch (error: any) {
                    toast({ variant: "destructive", title: "Error", description: "Failed to update location" });
                } finally {
                    setIsLocating(false);
                }
            },
            () => {
                toast({ variant: "destructive", title: "Error", description: "Position access denied" });
                setIsLocating(false);
            }
        );
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/login");
    };

    if (!workerProfile) return null;

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-2">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                </Button>

                <Card className="shadow-sm">
                    <CardHeader className="border-b bg-card rounded-t-lg">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                                {workerProfile.full_name?.charAt(0)}
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-bold">Profile Settings</CardTitle>
                                <p className="text-muted-foreground">Manage your worker profile and service area</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-8 bg-card">
                        {/* Personal Info */}
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="rate">Hourly Rate (₹)</Label>
                                <Input
                                    id="rate"
                                    type="number"
                                    value={formData.hourly_rate}
                                    onChange={e => setFormData({ ...formData, hourly_rate: Number(e.target.value) })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="bio">Professional Bio</Label>
                                <Textarea
                                    id="bio"
                                    rows={4}
                                    value={formData.bio}
                                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                    placeholder="Tell customers about your experience..."
                                />
                            </div>
                            <Button onClick={handleSave} disabled={loading} className="w-full sm:w-auto">
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Profile Changes
                            </Button>
                        </div>

                        {/* Location Section */}
                        <div className="pt-6 border-t">
                            <h3 className="text-lg font-semibold mb-4">Service Location</h3>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/50 rounded-xl border">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-green-700 dark:text-green-400">
                                        <MapPin className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Current Service Area</p>
                                        <p className="font-semibold">{locationName}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={updateLocation}
                                    disabled={isLocating}
                                    className="w-full sm:w-auto"
                                >
                                    {isLocating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                                    Update to My Current Location
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3 px-1">
                                We use your location to show you relevant job requests in your immediate area.
                                Update this whenever you move to a different service zone.
                            </p>
                        </div>

                        {/* Verification Section */}
                        <div className="pt-6 border-t">
                            <h3 className="text-lg font-semibold mb-4">Identity Verification</h3>
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-muted/50 rounded-xl border">
                                <div className="flex items-center gap-3">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${workerProfile.is_verified ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'}`}>
                                        {workerProfile.is_verified ? <CheckCircle className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{workerProfile.is_verified ? "Verified Worker" : "Verification Required"}</p>
                                        <p className="text-xs text-muted-foreground">{workerProfile.is_verified ? "Your identity is verified via DigiLocker." : "Verify your identity to get the verified badge and more trust."}</p>
                                    </div>
                                </div>
                                {!workerProfile.is_verified && (
                                    <Button onClick={initiateVerification} disabled={loading} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                                        Verify with DigiLocker
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Dangerous Zone */}
                        <div className="pt-8 border-t space-y-4">
                            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border">
                                <div className="flex items-center gap-3">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-slate-700 text-yellow-400' : 'bg-blue-100 text-blue-700'}`}>
                                        {darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <p className="font-semibold">Dark Mode</p>
                                        <p className="text-xs text-muted-foreground">Adjust the interface for better visibility</p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDarkMode(!darkMode)}
                                >
                                    {darkMode ? "Switch to Light" : "Switch to Dark"}
                                </Button>
                            </div>

                            <Button variant="destructive" onClick={handleLogout} className="w-full flex items-center justify-center gap-2">
                                <LogOut className="h-4 w-4" />
                                Sign Out
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
