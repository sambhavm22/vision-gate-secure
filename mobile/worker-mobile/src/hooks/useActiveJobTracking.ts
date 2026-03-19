import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../services/supabase';
import { useUser } from './useUser';

// Haversine formula to calculate distance in meters
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

interface TrackingProps {
    bookingId?: string;
    isActive: boolean;
    destinationLat?: number;
    destinationLng?: number;
}

export function useActiveJobTracking({ bookingId, isActive, destinationLat, destinationLng }: TrackingProps) {
    const { user, workerProfile } = useUser();
    const [isTracking, setIsTracking] = useState(false);
    const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
    const [distanceRemaining, setDistanceRemaining] = useState<number | null>(null);
    const locationSubscription = useRef<Location.LocationSubscription | null>(null);

    useEffect(() => {
        if (!isActive || !bookingId || !user?.id || !workerProfile?.id) {
            if (locationSubscription.current) {
                locationSubscription.current.remove();
                locationSubscription.current = null;
            }
            setIsTracking(false);
            return;
        }

        let isMounted = true;

        const startTracking = async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setIsTracking(false);
                return;
            }

            setIsTracking(true);

            locationSubscription.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: 10000, // Update every 10 seconds
                    distanceInterval: 10, // Or every 10 meters
                },
                async (newLocation) => {
                    if (!isMounted) return;

                    const { latitude, longitude, heading, speed } = newLocation.coords;

                    // 1. Update live location table
                    await supabase.from('worker_live_location').upsert(
                        {
                            worker_id: workerProfile.id,
                            booking_id: bookingId,
                            latitude,
                            longitude,
                            heading: heading || 0,
                            speed: speed || 0,
                            updated_at: new Date().toISOString(),
                        },
                        { onConflict: 'booking_id' }
                    );

                    // 2. Calculate ETA if destination is known
                    if (destinationLat && destinationLng) {
                        const distMeters = calculateDistance(latitude, longitude, destinationLat, destinationLng);

                        // Assume average city speed 8 m/s (~30km/h) if current speed is too low or invalid
                        const currentSpeed = (speed !== null && speed > 2) ? speed : 8;

                        const secondsRemaining = distMeters / currentSpeed;
                        const mins = Math.ceil(secondsRemaining / 60);

                        setDistanceRemaining(distMeters);
                        setEtaMinutes(mins);

                        // 3. Update ETA table
                        await supabase.from('eta_tracking').upsert(
                            {
                                booking_id: bookingId,
                                distance_remaining: distMeters,
                                eta_minutes: mins,
                                last_calculated_at: new Date().toISOString(),
                            },
                            { onConflict: 'booking_id' }
                        );
                    }
                }
            );
        };

        startTracking();

        return () => {
            isMounted = false;
            if (locationSubscription.current) {
                locationSubscription.current.remove();
                locationSubscription.current = null;
            }
        };
    }, [isActive, bookingId, user?.id, workerProfile?.id, destinationLat, destinationLng]);

    return { isTracking, etaMinutes, distanceRemaining };
}
