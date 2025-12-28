import { supabase } from "@vision-gate/supabase/client";
import { Badge, Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Label, useToast } from "@vision-gate/ui";
import { ArrowRight, Briefcase, Home, MapPin, Plus } from "lucide-react";
import { useEffect, useState } from "react";

interface Address {
    id: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    postal_code: string;
    label?: string; // e.g. Home, Work
    location?: any;
    lat?: number;
    lng?: number;
    is_default?: boolean;
    created_at?: string;
}

interface AddressSelectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (address: Address) => void;
    currentLocation?: string;
    initialAddress?: Address | null;
}

export function AddressSelectionDialog({ open, onOpenChange, onSelect, currentLocation, initialAddress }: AddressSelectionDialogProps) {
    const { toast } = useToast();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<"list" | "add">("list");

    // New Address Form State
    const [newAddress, setNewAddress] = useState({
        address_line1: "",
        city: "",
        postal_code: "",
        label: "Home",
        lat: 0,
        lng: 0
    });
    const [saving, setSaving] = useState(false);
    const [isLocating, setIsLocating] = useState(false);

    useEffect(() => {
        if (open) {
            if (initialAddress) {
                setNewAddress({
                    address_line1: initialAddress.address_line1,
                    city: initialAddress.city,
                    postal_code: initialAddress.postal_code,
                    label: initialAddress.label || "Home",
                    lat: initialAddress.lat || initialAddress.location?.lat || 0,
                    lng: initialAddress.lng || initialAddress.location?.lng || 0,
                });
                setView("add");
            } else {
                fetchAddresses();
                setView("list");
                // Reset form
                setNewAddress({
                    address_line1: "",
                    city: "",
                    postal_code: "",
                    label: "Home",
                    lat: 0,
                    lng: 0,
                });
            }
        }
    }, [open, initialAddress]);

    const fetchAddresses = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Note: Assuming 'addresses' table exists as per migration references
            // Using 'any' cast if types are missing in generated file
            const { data, error } = await (supabase.from("addresses") as any)
                .select("*")
                .eq("customer_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setAddresses(data || []);
        } catch (error) {
            console.error("Error fetching addresses", error);
            // Fallback/Mock for demo if table missing or empty
            // toast({ title: "Error", description: "Could not load addresses", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAddress = async () => {
        try {
            setSaving(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast({ title: "Error", description: "You must be logged in", variant: "destructive" });
                return;
            }

            if (!newAddress.address_line1 || !newAddress.city) {
                toast({ title: "Required", description: "Address and City are required", variant: "destructive" });
                return;
            }

            // Verify location (Geocode)
            // We use the result directly to avoid stale state issues in this closure
            const coords = await geocodeAddressIfNeeded();

            if (!coords) {
                toast({
                    title: "Location Unverified",
                    description: "We couldn't verify this address location. Please check the City/Pincode or use 'Current Location'.",
                    variant: "destructive"
                });
                return;
            }

            const addressData = {
                customer_id: user.id,
                ...newAddress,
                lat: coords.lat,
                lng: coords.lng
            };

            let savedAddress;

            if (initialAddress?.id) {
                // Update existing
                const { data, error } = await (supabase.from("addresses") as any)
                    .update(addressData)
                    .eq("id", initialAddress.id)
                    .select()
                    .single();
                if (error) throw error;
                savedAddress = data;
                toast({ title: "Success", description: "Address updated successfully" });
            } else {
                // Create new
                const { data, error } = await (supabase.from("addresses") as any)
                    .insert({ ...addressData, created_at: new Date().toISOString() })
                    .select()
                    .single();
                if (error) throw error;
                savedAddress = data;
                toast({ title: "Success", description: "Address saved successfully" });
            }

            // Refresh list if we are in list view context, but if we are editing, we are likely done.
            // If editing (initialAddress exists), we probably want to assume success and close/select.
            // If adding new, we add to list.

            if (initialAddress) {
                onSelect(savedAddress);
            } else {
                setAddresses([savedAddress, ...addresses]);
                setView("list");
            }

        } catch (error: any) {
            console.error("Error saving address", error);
            toast({ title: "Error", description: error.message || "Failed to save address", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const getUserLocation = () => {
        setIsLocating(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;

                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                        const data = await response.json();

                        if (data && data.address) {
                            const area = data.address.suburb || data.address.neighbourhood || data.address.residential || data.address.road || "";
                            const city = data.address.city || data.address.town || data.address.village || data.address.state_district || "";
                            const postcode = data.address.postcode || "";

                            setNewAddress(prev => ({
                                ...prev,
                                address_line1: area,
                                city: city,
                                postal_code: postcode,
                                lat: lat,
                                lng: lng
                            }));

                            toast({ title: "Location Found", description: `${area}, ${city}` });
                        }
                    } catch (error) {
                        console.error(error);
                        toast({ title: "Error", description: "Could not fetch address details", variant: "destructive" });
                    } finally {
                        setIsLocating(false);
                    }
                },
                (error) => {
                    console.error(error);
                    toast({ title: "Error", description: "Location access denied", variant: "destructive" });
                    setIsLocating(false);
                }
            );
        } else {
            setIsLocating(false);
        }
    };

    const fetchLocationFromPincode = async (pincode: string) => {
        if (!pincode || pincode.length < 6) return;

        try {
            // Specialized query for postal codes
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&postalcode=${pincode}&country=India&limit=1`);
            const data = await response.json();

            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);

                // Nominatim display_name usually has hierarchy
                const displayName = data[0].display_name || "";
                const parts = displayName.split(", ");

                let city = newAddress.city;
                if (!city) {
                    // In standard nominatim: [Area, City, State, Postcode, Country]
                    city = parts.length > 3 ? parts[parts.length - 4] : parts[0];
                }

                console.log("Fetched from PIN:", lat, lng, city);

                setNewAddress(prev => ({
                    ...prev,
                    lat,
                    lng,
                    city: prev.city || city // Only auto-fill if empty
                }));

                toast({ title: "Location Found", description: "City and coordinates updated from pincode." });
            }
        } catch (error) {
            console.error("Error fetching from pincode", error);
        }
    };

    // Returns coordinates object or null
    const geocodeAddressIfNeeded = async (): Promise<{ lat: number, lng: number } | null> => {
        // If we already have coordinates, use them
        if (newAddress.lat && newAddress.lng) {
            return { lat: newAddress.lat, lng: newAddress.lng };
        }

        // Try structured search
        try {
            let url = "";
            let queryType = "";

            if (newAddress.postal_code && newAddress.postal_code.length >= 6) {
                url = `https://nominatim.openstreetmap.org/search?format=json&postalcode=${newAddress.postal_code}&country=India&limit=1`;
                queryType = "postal";
            } else if (newAddress.city) {
                const q = `${newAddress.address_line1 ? newAddress.address_line1 + ', ' : ''}${newAddress.city}`;
                url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&country=India&limit=1`;
                queryType = "address";
            } else {
                return null;
            }

            // Using fetch explicitly for Nominatim
            // Consider adding User-Agent logic if implementing backend proxy, but for frontend fetch browser handles headers.
            const response = await fetch(url);
            const data = await response.json();

            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);

                // Update state for UI feedback (though save might complete before render)
                setNewAddress(prev => ({ ...prev, lat, lng }));

                return { lat, lng };
            }
        } catch (error) {
            console.error("Geocoding failed", error);
        }
        return null; // Failed or not found
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {view === "list" ? "Select Service Location" : (initialAddress ? "Edit Address" : "Add New Address")}
                    </DialogTitle>
                </DialogHeader>

                {view === "list" ? (
                    <div className="space-y-4 pt-2">
                        {/* Current Location Suggestion */}
                        {currentLocation && (
                            <div
                                className="border-2 border-primary/20 bg-primary/5 rounded-xl p-4 cursor-pointer hover:border-primary transition-all relative overflow-hidden group"
                                onClick={() => {
                                    // Handle selection of current location
                                    // To get an ID, we might need to save it, or Payment page needs to handle it.
                                    // For now, let's trigger the "Add" view with pre-filled data if they click this,
                                    // or just pass a temporary object if Payment can handle null ID.
                                    // Actually, let's pre-fill the Add form and switch view for confirmation.
                                    const [area, cityPart] = currentLocation.split(',');
                                    setNewAddress(prev => ({
                                        ...prev,
                                        address_line1: area,
                                        city: cityPart?.trim() || "",
                                        // Default to Mumbai center if just string passed without coords
                                        lat: 19.0760,
                                        lng: 72.8777
                                    }));
                                    setView("add");
                                    toast({ title: "Confirm Address", description: "Please confirm your current location details." });
                                }}
                            >
                                <div className="absolute top-0 right-0 p-2">
                                    <Badge variant="default" className="text-[10px] bg-primary">Suggested</Badge>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <MapPin className="h-5 w-5 animate-pulse" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Use Current Location</p>
                                        <p className="text-sm font-medium line-clamp-1">{currentLocation}</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                            <span className="h-px flex-1 bg-border"></span>
                            <span>Saved Addresses</span>
                            <span className="h-px flex-1 bg-border"></span>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full border-dashed border-primary/50 text-primary hover:bg-primary/5 h-12"
                            onClick={() => {
                                setNewAddress({
                                    address_line1: "",
                                    city: "",
                                    postal_code: "",
                                    label: "Home",
                                    lat: null,
                                    lng: null
                                });
                                setView("add");
                            }}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Address
                        </Button>

                        {loading ? (
                            <div className="text-center py-8 text-muted-foreground">Loading addresses...</div>
                        ) : addresses.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>No saved addresses found.</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {addresses.map((addr) => (
                                    <div
                                        key={addr.id}
                                        className="relative border rounded-xl p-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group"
                                        onClick={() => onSelect(addr)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1 h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                                                {addr.label === "Work" ? <Briefcase className="h-4 w-4" /> :
                                                    addr.label === "Home" ? <Home className="h-4 w-4" /> :
                                                        <MapPin className="h-4 w-4" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-sm">{addr.label || "Address"}</span>
                                                    {addr.is_default && <Badge variant="secondary" className="text-[10px] h-5">Default</Badge>}
                                                </div>
                                                <p className="text-sm text-slate-600 line-clamp-2">{addr.address_line1}, {addr.city}</p>
                                                <p className="text-xs text-slate-400 mt-1">{addr.postal_code}</p>
                                            </div>
                                            <div className="self-center">
                                                <div className="h-4 w-4 rounded-full border-2 border-slate-300 group-hover:border-primary" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4 pt-2">
                        <div className="flex gap-2 mb-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={getUserLocation}
                                disabled={isLocating}
                            >
                                {isLocating ? <span className="animate-spin mr-2">⏳</span> : <MapPin className="h-4 w-4 mr-2" />}
                                Use Current Location
                            </Button>
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label>Label</Label>
                                <div className="flex gap-2">
                                    {["Home", "Work", "Other"].map(l => (
                                        <Badge
                                            key={l}
                                            variant={newAddress.label === l ? "default" : "outline"}
                                            className="cursor-pointer px-4 py-1.5"
                                            onClick={() => setNewAddress({ ...newAddress, label: l })}
                                        >
                                            {l}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="address">Address Line</Label>
                                <Input
                                    id="address"
                                    placeholder="House/Flat No, Street, Area"
                                    value={newAddress.address_line1}
                                    onChange={e => setNewAddress({ ...newAddress, address_line1: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        placeholder="City"
                                        value={newAddress.city}
                                        onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="zip">Pincode</Label>
                                    <Input
                                        id="zip"
                                        placeholder="Zip Code"
                                        value={newAddress.postal_code}
                                        onChange={e => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                                        onBlur={(e) => fetchLocationFromPincode(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t mt-4">
                            <Button variant="ghost" className="flex-1" onClick={() => setView("list")}>Cancel</Button>
                            <Button className="flex-1 bg-primary" onClick={handleSaveAddress} disabled={saving}>
                                {saving ? "Saving..." : "Save & Select"}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
