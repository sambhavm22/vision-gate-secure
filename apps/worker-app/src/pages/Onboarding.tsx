import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useServices } from "@/hooks/useServices";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@vision-gate/supabase/client";
import { Loader2, MapPin } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import * as z from "zod";

const formSchema = z.object({
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    bio: z.string().optional(),
    hourly_rate: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Must be a positive number"),
    service_types: z.array(z.string()).min(1, "Select at least one service"),
    location_lat: z.number(),
    location_lng: z.number(),
});

export default function Onboarding() {
    const { user, refreshProfile } = useAuth();
    const { services, isLoading: servicesLoading } = useServices();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [locating, setLocating] = useState(false);

    const [addressDisplay, setAddressDisplay] = useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            full_name: user?.user_metadata?.full_name || "",
            bio: "",
            hourly_rate: "",
            service_types: [],
            location_lat: 0,
            location_lng: 0,
        },
    });

    const getLocation = () => {
        setLocating(true);
        if (!navigator.geolocation) {
            toast({ variant: "destructive", title: "Error", description: "Geolocation not supported" });
            setLocating(false);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                form.setValue("location_lat", lat);
                form.setValue("location_lng", lng);

                try {
                    // Reverse Geocoding via Nominatim (Free, no key required)
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                    const data = await response.json();

                    if (data && data.address) {
                        const area = data.address.suburb || data.address.neighbourhood || data.address.road || "Unknown Area";
                        const city = data.address.city || data.address.town || data.address.village || data.address.state_district || "";
                        const formattedAddress = city ? `${area}, ${city}` : area;
                        setAddressDisplay(formattedAddress);
                        toast({ title: "Location Acquired", description: `Set to: ${formattedAddress}` });
                    } else {
                        setAddressDisplay(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
                        toast({ title: "Location Acquired", description: "Your current location has been set." });
                    }
                } catch (error) {
                    console.error("Geocoding error:", error);
                    // Fallback to coordinates
                    setAddressDisplay(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
                    toast({ title: "Location Acquired", description: "Your current location has been set." });
                } finally {
                    setLocating(false);
                }
            },
            (error) => {
                setLocating(false);
                let errorMessage = "Unknown error";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "User denied the request for Geolocation. Please enable location permissions.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Location information is unavailable.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "The request to get user location timed out.";
                        break;
                    default:
                        errorMessage = error.message;
                }
                toast({ variant: "destructive", title: "Location Error", description: errorMessage });
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!user) return;
        setIsSubmitting(true);

        try {
            // Point(lng lat) standard for PostGIS
            const location = `POINT(${values.location_lng} ${values.location_lat})`;

            // @ts-ignore
            const { error } = await supabase.from("workers_public").insert({
                id: user.id,
                full_name: values.full_name,
                bio: values.bio,
                hourly_rate: Number(values.hourly_rate),
                service_types: values.service_types,
                location: location,
                is_verified: false, // Default unverified
                rating: 5.0, // Start with 5 stars
            });

            if (error) throw error;

            await refreshProfile();
            toast({ title: "Profile Created", description: "Welcome to HelperHub!" });
            navigate("/");
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="container mx-auto max-w-2xl py-10 px-4">
            <Card>
                <CardHeader>
                    <CardTitle>Create Worker Profile</CardTitle>
                    <CardDescription>Tell us about yourself and what you do.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            <FormField
                                control={form.control}
                                name="full_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="space-y-3">
                                <FormLabel>Services You Provide</FormLabel>
                                {servicesLoading ? (
                                    <div>Loading services...</div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        {services.map((service) => (
                                            <FormField
                                                key={service.id}
                                                control={form.control}
                                                name="service_types"
                                                render={({ field }) => {
                                                    return (
                                                        <FormItem key={service.id} className="flex flex-row items-start space-x-3 space-y-0">
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(service.name)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                            ? field.onChange([...field.value, service.name])
                                                                            : field.onChange(
                                                                                field.value?.filter((value) => value !== service.name)
                                                                            )
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">{service.name}</FormLabel>
                                                        </FormItem>
                                                    );
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                                <FormMessage>{form.formState.errors.service_types?.message}</FormMessage>
                            </div>

                            <FormField
                                control={form.control}
                                name="hourly_rate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Hourly Rate (₹)</FormLabel>
                                        <FormControl><Input type="number" placeholder="200" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="bio"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Bio</FormLabel>
                                        <FormControl><Textarea placeholder="I am experienced in..." {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="space-y-2">
                                <FormLabel>Your Base Location</FormLabel>
                                <div className="flex items-center gap-4">
                                    <Button type="button" variant="outline" onClick={getLocation} disabled={locating}>
                                        {locating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                                        {addressDisplay ? "Update Location" : "Get Current Location"}
                                    </Button>
                                    {addressDisplay && (
                                        <span className="text-sm text-green-600 font-medium">
                                            {addressDisplay}
                                        </span>
                                    )}
                                </div>
                                <FormMessage>{form.formState.errors.location_lat?.message}</FormMessage>
                            </div>

                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Create Profile
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
