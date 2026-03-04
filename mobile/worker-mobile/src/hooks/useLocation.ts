/**
 * Hook to manage worker location
 * - Requests location permissions
 * - Gets current GPS coordinates
 * - Saves location to workers_public.location as PostGIS geography
 * - Updates location when worker goes online
 */

import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../services/supabase';

interface LocationState {
    latitude: number | null;
    longitude: number | null;
    loading: boolean;
    error: string | null;
}

export function useLocation(workerId: string | null, isOnline: boolean) {
    const [location, setLocation] = useState<LocationState>({
        latitude: null,
        longitude: null,
        loading: false,
        error: null,
    });
    const watchSubscription = useRef<Location.LocationSubscription | null>(null);

    const saveLocationToDb = useCallback(async (lat: number, lng: number) => {
        if (!workerId) return;
        try {
            // Use RPC to properly create a PostGIS geography point
            const { error } = await (supabase.rpc as any)('update_worker_location', {
                p_worker_id: workerId,
                p_lat: lat,
                p_lng: lng,
            });

            if (error) {
                console.error('Failed to save location to DB:', error.message);
            }
        } catch (err) {
            console.error('Location save error:', err);
        }
    }, [workerId]);

    const requestAndGetLocation = useCallback(async () => {
        setLocation(prev => ({ ...prev, loading: true, error: null }));

        try {
            // Request permission
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setLocation(prev => ({
                    ...prev,
                    loading: false,
                    error: 'Location permission denied',
                }));
                Alert.alert(
                    'Location Required',
                    'Location access is needed to show you nearby job requests. Please enable location in your device settings.',
                );
                return;
            }

            // Get current position
            const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const { latitude, longitude } = currentLocation.coords;
            setLocation({
                latitude,
                longitude,
                loading: false,
                error: null,
            });

            // Save to database
            await saveLocationToDb(latitude, longitude);
        } catch (err: any) {
            console.error('Location error:', err);
            setLocation(prev => ({
                ...prev,
                loading: false,
                error: err.message || 'Failed to get location',
            }));
        }
    }, [saveLocationToDb]);

    // Get location on mount and when worker goes online
    useEffect(() => {
        if (!workerId) return;
        requestAndGetLocation();
    }, [workerId, requestAndGetLocation]);

    // When worker toggles online, refresh location
    useEffect(() => {
        if (!workerId || !isOnline) return;
        requestAndGetLocation();
    }, [isOnline, workerId, requestAndGetLocation]);

    // Watch location in background when online (update every ~60 seconds)
    useEffect(() => {
        if (!workerId || !isOnline) {
            // Stop watching when offline
            if (watchSubscription.current) {
                watchSubscription.current.remove();
                watchSubscription.current = null;
            }
            return;
        }

        const startWatching = async () => {
            const { status } = await Location.getForegroundPermissionsAsync();
            if (status !== 'granted') return;

            watchSubscription.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.Balanced,
                    timeInterval: 60000,      // Update every 60 seconds
                    distanceInterval: 100,     // Or when moved 100 meters
                },
                (newLocation) => {
                    const { latitude, longitude } = newLocation.coords;
                    setLocation(prev => ({ ...prev, latitude, longitude }));
                    saveLocationToDb(latitude, longitude);
                }
            );
        };

        startWatching();

        return () => {
            if (watchSubscription.current) {
                watchSubscription.current.remove();
                watchSubscription.current = null;
            }
        };
    }, [workerId, isOnline, saveLocationToDb]);

    return {
        ...location,
        refreshLocation: requestAndGetLocation,
    };
}
