import { supabase } from "@vision-gate/supabase/client";
import { Badge, Button, Dialog, DialogContent, DialogHeader, DialogTitle, useToast } from "@vision-gate/ui";
import { ArrowLeft, Briefcase, Home, MapPin, Plus } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { MapPicker, MapPosition, AddressSearch, AddressForm, AddressFormData } from "./map";
import { useAddressProvider, AddressSearchResult } from "@/lib/address";

interface Address {
    id: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    postal_code: string;
    label?: string;
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

type ViewMode = "list" | "add" | "map";

export function AddressSelectionDialog({ open, onOpenChange, onSelect, currentLocation, initialAddress }: AddressSelectionDialogProps) {
    const { toast } = useToast();
    const { t } = useTranslation();
    const addressProvider = useAddressProvider();

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<ViewMode>("list");
    const [saving, setSaving] = useState(false);

    // Map position state
    const [mapPosition, setMapPosition] = useState<MapPosition | undefined>(undefined);

    // Form state
    const [formData, setFormData] = useState<AddressFormData>({
        label: "Home",
        fullAddress: "",
        city: "",
        pincode: "",
        lat: 0,
        lng: 0
    });

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            if (initialAddress) {
                // Editing existing address
                setFormData({
                    label: initialAddress.label || "Home",
                    fullAddress: initialAddress.address_line1,
                    city: initialAddress.city,
                    pincode: initialAddress.postal_code,
                    lat: initialAddress.lat || 0,
                    lng: initialAddress.lng || 0
                });
                setMapPosition(
                    initialAddress.lat && initialAddress.lng
                        ? { lat: initialAddress.lat, lng: initialAddress.lng }
                        : undefined
                );
                setView("map");
            } else {
                // Fresh start
                fetchAddresses();
                setView("list");
                resetForm();
            }
        }
    }, [open, initialAddress]);

    const resetForm = () => {
        setFormData({
            label: "Home",
            fullAddress: "",
            city: "",
            pincode: "",
            lat: 0,
            lng: 0
        });
        setMapPosition(undefined);
    };

    const fetchAddresses = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await (supabase.from("addresses") as any)
                .select("*")
                .eq("customer_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setAddresses(data || []);
        } catch (error) {
            console.error("Error fetching addresses", error);
        } finally {
            setLoading(false);
        }
    };

    // Handle map position change (drag or click)
    const handlePositionChange = useCallback(async (position: MapPosition) => {
        setMapPosition(position);
        setFormData(prev => ({
            ...prev,
            lat: position.lat,
            lng: position.lng
        }));

        // Reverse geocode using mock provider
        try {
            const result = await addressProvider.reverseGeocode(position.lat, position.lng);
            setFormData(prev => ({
                ...prev,
                fullAddress: prev.fullAddress || result.fullAddress,
                city: prev.city || result.city,
                pincode: prev.pincode || result.pincode
            }));
        } catch (error) {
            console.error("Reverse geocode error:", error);
        }
    }, [addressProvider]);

    // Handle address search selection
    const handleSearchSelect = useCallback((result: AddressSearchResult) => {
        setMapPosition({ lat: result.latitude, lng: result.longitude });
        setFormData(prev => ({
            ...prev,
            fullAddress: result.label,
            city: result.city,
            pincode: result.pincode,
            lat: result.latitude,
            lng: result.longitude
        }));
    }, []);

    // Get current location
    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast({ title: "Error", description: "Geolocation not supported", variant: "destructive" });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setMapPosition({ lat, lng });
                setFormData(prev => ({ ...prev, lat, lng }));

                // Reverse geocode
                try {
                    const result = await addressProvider.reverseGeocode(lat, lng);
                    setFormData(prev => ({
                        ...prev,
                        fullAddress: result.fullAddress,
                        city: result.city,
                        pincode: result.pincode
                    }));
                    toast({ title: "Location Found", description: result.fullAddress });
                } catch (error) {
                    console.error("Reverse geocode error:", error);
                }
            },
            (error) => {
                console.error(error);
                toast({ title: "Error", description: "Location access denied", variant: "destructive" });
            }
        );
    };

    // Save address to Supabase
    const handleSaveAddress = async () => {
        try {
            setSaving(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast({ title: "Error", description: "You must be logged in", variant: "destructive" });
                return;
            }

            if (!formData.fullAddress || !formData.city) {
                toast({ title: "Required", description: "Address and City are required", variant: "destructive" });
                return;
            }

            if (!formData.lat || !formData.lng) {
                toast({
                    title: "Location Required",
                    description: "Please select a location on the map or use current location",
                    variant: "destructive"
                });
                return;
            }

            const addressData = {
                customer_id: user.id,
                address_line1: formData.fullAddress,
                city: formData.city,
                postal_code: formData.pincode,
                label: formData.label,
                lat: formData.lat,
                lng: formData.lng
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

    const openMapView = () => {
        resetForm();
        setView("map");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {view === "map" && (
                            <Button variant="ghost" size="icon" onClick={() => setView("list")} className="h-8 w-8">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        )}
                        {view === "list" ? t('address.select_location') :
                            view === "map" ? (initialAddress ? t('address.edit_address') : t('address.add_new')) :
                                t('address.add_new')}
                    </DialogTitle>
                </DialogHeader>

                {view === "list" ? (
                    <div className="space-y-4 pt-2">
                        {/* Current Location Suggestion */}
                        {currentLocation && (
                            <div
                                className="border-2 border-primary/20 bg-primary/5 rounded-xl p-4 cursor-pointer hover:border-primary transition-all relative overflow-hidden group"
                                onClick={openMapView}
                            >
                                <div className="absolute top-0 right-0 p-2">
                                    <Badge variant="default" className="text-[10px] bg-primary">{t('address.suggested')}</Badge>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <MapPin className="h-5 w-5 animate-pulse" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">{t('address.use_current')}</p>
                                        <p className="text-sm font-medium line-clamp-1">{currentLocation}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                            <span className="h-px flex-1 bg-border"></span>
                            <span>{t('address.saved_addresses')}</span>
                            <span className="h-px flex-1 bg-border"></span>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full border-dashed border-primary/50 text-primary hover:bg-primary/5 h-12"
                            onClick={openMapView}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            {t('address.add_new')}
                        </Button>

                        {loading ? (
                            <div className="text-center py-8 text-muted-foreground">Loading addresses...</div>
                        ) : addresses.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>{t('address.no_saved')}</p>
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
                ) : view === "map" ? (
                    <div className="space-y-4 pt-2">
                        {/* Address Search */}
                        <AddressSearch
                            onSelect={handleSearchSelect}
                            placeholder={t('address.search_placeholder', 'Search for an address...')}
                        />

                        {/* Map */}
                        <MapPicker
                            position={mapPosition}
                            onPositionChange={handlePositionChange}
                            height="250px"
                        />

                        {/* Current Location Button */}
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={handleGetCurrentLocation}
                        >
                            <MapPin className="h-4 w-4 mr-2" />
                            {t('address.use_current')}
                        </Button>

                        {/* Address Form */}
                        <AddressForm
                            value={formData}
                            onChange={setFormData}
                            showCoordinates={true}
                        />

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 border-t">
                            <Button variant="ghost" className="flex-1" onClick={() => setView("list")}>
                                {t('rating.cancel')}
                            </Button>
                            <Button className="flex-1 bg-primary" onClick={handleSaveAddress} disabled={saving}>
                                {saving ? t('common.loading') : t('address.save_select')}
                            </Button>
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
