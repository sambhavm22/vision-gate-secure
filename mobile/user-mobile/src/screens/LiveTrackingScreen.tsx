/**
 * Live Tracking Screen
 * Displays real-time worker location and ETA on a map
 */

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { RootStackParamList } from '../App';
import { supabase } from '../services/supabase';

type Props = NativeStackScreenProps<RootStackParamList, 'LiveTracking'>;

interface LocationData {
    latitude: number;
    longitude: number;
    heading?: number;
}

export function LiveTrackingScreen({ route, navigation }: Props): React.JSX.Element {
    const { bookingId } = route.params;

    const [loading, setLoading] = useState(true);
    const [workerLocation, setWorkerLocation] = useState<LocationData | null>(null);
    const [destination, setDestination] = useState<LocationData | null>(null);
    const [workerName, setWorkerName] = useState('Your Expert');
    const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
    const [distanceRemaining, setDistanceRemaining] = useState<number | null>(null);

    const mapRef = useRef<MapView>(null);

    // Fetch initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Get destination coords and worker name
                const { data: bookingData, error: bookingErr } = await supabase
                    .from('bookings')
                    .select('workers_public(full_name), addresses(lat, lng)')
                    .eq('id', bookingId)
                    .single();

                if (bookingErr) throw bookingErr;

                // Supabase types might infer array or object for relations depending on schema hints
                const address = Array.isArray(bookingData?.addresses) ? bookingData.addresses[0] : bookingData?.addresses;
                const worker = Array.isArray(bookingData?.workers_public) ? bookingData.workers_public[0] : bookingData?.workers_public;

                if (address?.lat && address?.lng) {
                    setDestination({
                        latitude: address.lat as number,
                        longitude: address.lng as number,
                    });
                }
                if (worker?.full_name) {
                    setWorkerName(worker.full_name as string);
                }

                // Get current live location
                const { data: locData, error: locErr } = await supabase
                    .from('worker_live_location')
                    .select('latitude, longitude, heading')
                    .eq('booking_id', bookingId)
                    .maybeSingle();

                if (locData) {
                    setWorkerLocation(locData);
                }

                // Get current ETA
                const { data: etaData } = await supabase
                    .from('eta_tracking')
                    .select('eta_minutes, distance_remaining')
                    .eq('booking_id', bookingId)
                    .maybeSingle();

                if (etaData) {
                    setEtaMinutes(etaData.eta_minutes);
                    setDistanceRemaining(etaData.distance_remaining);
                }

            } catch (err) {
                console.error('Error fetching tracking data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [bookingId]);

    // Supabase Realtime Subscriptions
    useEffect(() => {
        if (!bookingId) return;

        const channel = supabase
            .channel(`tracking_${bookingId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'worker_live_location',
                    filter: `booking_id=eq.${bookingId}`,
                },
                (payload) => {
                    const newLocation = payload.new as any;
                    if (newLocation.latitude && newLocation.longitude) {
                        setWorkerLocation({
                            latitude: newLocation.latitude,
                            longitude: newLocation.longitude,
                            heading: newLocation.heading,
                        });

                        // Recenter map slightly if needed
                        if (mapRef.current) {
                            mapRef.current.animateCamera({
                                center: { latitude: newLocation.latitude, longitude: newLocation.longitude },
                                pitch: 45,
                                heading: newLocation.heading || 0,
                            });
                        }
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'eta_tracking',
                    filter: `booking_id=eq.${bookingId}`,
                },
                (payload) => {
                    const newEta = payload.new as any;
                    if (newEta.eta_minutes !== undefined) {
                        setEtaMinutes(newEta.eta_minutes);
                        setDistanceRemaining(newEta.distance_remaining);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [bookingId]);

    // Fit to markers when both are ready
    useEffect(() => {
        if (mapRef.current && workerLocation && destination) {
            mapRef.current.fitToCoordinates(
                [workerLocation, destination],
                { edgePadding: { top: 100, right: 50, bottom: 200, left: 50 }, animated: true }
            );
        }
    }, [workerLocation, destination]);

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.loadingText}>Locating Worker...</Text>
            </SafeAreaView>
        );
    }

    // Default map region to destination if no worker location yet
    const initialRegion = {
        latitude: workerLocation?.latitude || destination?.latitude || 28.6139,
        longitude: workerLocation?.longitude || destination?.longitude || 77.2090,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Live Tracking</Text>
                <View style={{ width: 44 }} />
            </View>

            {/* Map */}
            <View style={styles.mapContainer}>
                <MapView
                    ref={mapRef}
                    provider={PROVIDER_GOOGLE}
                    style={styles.map}
                    initialRegion={initialRegion}
                    showsUserLocation={true}
                    showsCompass={false}
                >
                    {/* Destination Marker */}
                    {destination && (
                        <Marker coordinate={destination} title="Your Location" description="Service Address" />
                    )}

                    {/* Worker Marker */}
                    {workerLocation && (
                        <Marker
                            coordinate={workerLocation}
                            title={workerName}
                            description={etaMinutes ? `Arriving in ${etaMinutes} mins` : 'On the way'}
                            rotation={workerLocation.heading || 0}
                            anchor={{ x: 0.5, y: 0.5 }}
                        >
                            <View style={styles.workerMarker}>
                                <Text style={styles.workerMarkerIcon}>🚗</Text>
                            </View>
                        </Marker>
                    )}
                </MapView>

                {/* Info Card Overlay */}
                <View style={styles.infoCardWrapper}>
                    <View style={styles.infoCard}>
                        <View style={styles.infoCardHeader}>
                            <View style={styles.infoAvatar}>
                                <Text style={styles.infoAvatarText}>{workerName[0].toUpperCase()}</Text>
                            </View>
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoName}>{workerName}</Text>
                                <Text style={styles.infoStatus}>is on the way</Text>
                            </View>
                        </View>

                        <View style={styles.etaDivider} />

                        <View style={styles.etaRow}>
                            <View style={styles.etaBlock}>
                                <Text style={styles.etaLabel}>ETA</Text>
                                <Text style={styles.etaValue}>
                                    {etaMinutes !== null ? `${etaMinutes} min` : 'Calculating...'}
                                </Text>
                            </View>
                            <View style={styles.verticalDivider} />
                            <View style={styles.etaBlock}>
                                <Text style={styles.etaLabel}>DISTANCE</Text>
                                <Text style={styles.etaValue}>
                                    {distanceRemaining !== null ? `${(distanceRemaining / 1000).toFixed(1)} km` : '--'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    loadingContainer: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: '#94a3b8', marginTop: 16, fontSize: 16 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#0f172a', zIndex: 10,
    },
    backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
    backText: { color: '#f8fafc', fontSize: 24 },
    headerTitle: { color: '#f8fafc', fontSize: 18, fontWeight: 'bold' },
    mapContainer: { flex: 1 },
    map: { ...StyleSheet.absoluteFillObject },
    workerMarker: {
        backgroundColor: '#10b981', width: 40, height: 40, borderRadius: 20,
        justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5,
    },
    workerMarkerIcon: { fontSize: 20 },
    infoCardWrapper: { position: 'absolute', bottom: 30, left: 20, right: 20 },
    infoCard: {
        backgroundColor: '#1e293b', borderRadius: 20, padding: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8,
        borderWidth: 1, borderColor: '#334155',
    },
    infoCardHeader: { flexDirection: 'row', alignItems: 'center' },
    infoAvatar: {
        width: 50, height: 50, borderRadius: 25, backgroundColor: '#10b981',
        justifyContent: 'center', alignItems: 'center', marginRight: 16,
    },
    infoAvatarText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
    infoTextContainer: { flex: 1 },
    infoName: { color: '#f8fafc', fontSize: 18, fontWeight: 'bold' },
    infoStatus: { color: '#10b981', fontSize: 14, fontWeight: '600', marginTop: 2 },
    etaDivider: { height: 1, backgroundColor: '#334155', marginVertical: 16 },
    etaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    etaBlock: { flex: 1, alignItems: 'center' },
    etaLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '600', marginBottom: 4 },
    etaValue: { color: '#f8fafc', fontSize: 22, fontWeight: 'bold' },
    verticalDivider: { width: 1, height: 30, backgroundColor: '#334155' },
});
