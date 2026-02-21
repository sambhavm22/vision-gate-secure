/**
 * useLocation Hook
 * Centralized location service using expo-location (Expo-managed API).
 * Works universally across Expo Go, iOS Simulator, and Android Emulator.
 */

import * as Location from 'expo-location';
import { useState } from 'react';

interface LocationAddress {
    fullAddress: string;
    city: string;
    zip: string;
}

interface UseLocationReturn {
    address: LocationAddress | null;
    loading: boolean;
    error: string | null;
    getCurrentLocation: () => Promise<LocationAddress | null>;
}

/**
 * Hook for fetching the user's current location and reverse-geocoding it
 * into a human-readable address. Uses expo-location for full cross-platform
 * compatibility (Expo Go, iOS Simulator, Android Emulator).
 *
 * Simulators return a default location (Apple HQ on iOS, Mountain View on Android)
 * so this will always return a valid result even without real GPS hardware.
 */
export function useLocation(): UseLocationReturn {
    const [address, setAddress] = useState<LocationAddress | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getCurrentLocation = async (): Promise<LocationAddress | null> => {
        setLoading(true);
        setError(null);

        try {
            // Request foreground location permission using Expo API
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                setError('Location permission denied. Please enable it in Settings.');
                setLoading(false);
                return null;
            }

            // Get current position — works on simulators with default coordinates
            const position = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            // Reverse geocode coordinates into a street address
            const [geocoded] = await Location.reverseGeocodeAsync({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            });

            if (geocoded) {
                const locationAddress: LocationAddress = {
                    fullAddress: [
                        geocoded.streetNumber,
                        geocoded.street,
                        geocoded.district,
                        geocoded.subregion,
                    ]
                        .filter(Boolean)
                        .join(', ') || 'Address fetched',
                    city: geocoded.city || geocoded.region || '',
                    zip: geocoded.postalCode || '',
                };

                setAddress(locationAddress);
                setLoading(false);
                return locationAddress;
            }

            // Fallback if reverse geocoding returns nothing
            setError('Could not determine address from location.');
            setLoading(false);
            return null;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to get location';
            setError(message);
            setLoading(false);
            return null;
        }
    };

    return { address, loading, error, getCurrentLocation };
}
