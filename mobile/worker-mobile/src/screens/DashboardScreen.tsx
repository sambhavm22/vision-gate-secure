import Slider from '@react-native-community/slider';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useLocation } from '../hooks/useLocation';
import { useNotifications } from '../hooks/useNotifications';
import { useUser } from '../hooks/useUser';
import { supabase } from '../services/supabase';

interface BookingRequest {
    id: string;
    customer_id: string;
    service_name: string;
    service_id: string;
    status: string;
    scheduled_at: string;
    duration_minutes: number;
    total_amount: number | null;
    notes: string | null;
    created_at: string;
    distance_km?: number;
    customer_name?: string;
    address_line1?: string;
    city?: string;
}

export function DashboardScreen(): React.JSX.Element {
    const { user, workerProfile, refreshProfile } = useUser();
    const { notification } = useNotifications(user?.id ?? null);

    // States
    const [isOnline, setIsOnline] = useState(workerProfile?.is_online ?? false);
    const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
    const [activeBooking, setActiveBooking] = useState<BookingRequest | null>(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Location — requests GPS permission, saves to workers_public.location
    const {
        latitude,
        longitude,
        loading: locationLoading,
        error: locationError,
        refreshLocation,
    } = useLocation(workerProfile?.id ?? null, isOnline);

    // Filter States
    const [sortBy, setSortBy] = useState<'earliest' | 'closest'>('earliest');
    const [serviceFilter, setServiceFilter] = useState<string>('All Services');
    const [distanceFilter, setDistanceFilter] = useState<number>(50); // Default 50km

    // Stats State
    const [stats, setStats] = useState({ totalJobs: 0, rating: '5.0' });

    // Sync online status from profile
    useEffect(() => {
        if (workerProfile) {
            setIsOnline(workerProfile.is_online ?? false);
        }
    }, [workerProfile]);

    const fetchStats = useCallback(async () => {
        if (!workerProfile) return;
        try {
            // Only fetching count of scheduled/active jobs for "Total Jobs" stat
            const { count } = await supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('worker_id', workerProfile.id)
                .in('status', ['accepted', 'en_route', 'in_progress', 'assigned']);

            setStats(prev => ({ ...prev, totalJobs: count || 0 }));
        } catch (err) {
            // Ignore stats error
        }
    }, [workerProfile]);

    const fetchBookings = useCallback(async () => {
        if (!workerProfile || !isOnline) {
            setBookingRequests([]);
            return;
        }

        try {
            // Fetch market bookings via RPC
            const { data: marketData, error: marketError } = await (supabase.rpc as any)(
                'get_market_bookings_v2',
                {
                    p_worker_id: workerProfile.id,
                    p_limit: 50,
                    p_radius_km: distanceFilter,
                }
            );

            if (marketError) throw marketError;
            setBookingRequests(marketData || []);

            // Fetch active booking
            const { data: activeData, error: activeError } = await supabase
                .from('bookings')
                .select('*, services(name), addresses(address_line1, city)')
                .eq('worker_id', workerProfile.id)
                .in('status', ['accepted', 'en_route', 'in_progress'])
                .order('scheduled_at', { ascending: true })
                .limit(1)
                .maybeSingle();

            if (activeError) throw activeError;

            if (activeData) {
                setActiveBooking({
                    ...activeData,
                    service_name: (activeData as any).services?.name || activeData.service_name || 'Service',
                    address_line1: (activeData as any).addresses?.address_line1,
                    city: (activeData as any).addresses?.city,
                });
            } else {
                setActiveBooking(null);
            }
        } catch (err) {
            console.error('Fetch bookings error:', err);
        }
    }, [workerProfile, isOnline, distanceFilter]);

    useEffect(() => {
        setLoading(true);
        fetchStats();
        fetchBookings().finally(() => setLoading(false));
    }, [fetchBookings, fetchStats]);

    // Real-time subscriptions — bookings + notifications
    useEffect(() => {
        if (!workerProfile) return;

        const channel = supabase
            .channel('worker-dashboard-realtime')
            // Listen for all booking changes (new requests, status updates, cancellations)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
                fetchBookings();
                fetchStats();
            })
            // Listen for new notifications targeted at this worker (in-app alert)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${workerProfile.id}`,
                },
                (payload: any) => {
                    const n = payload.new;
                    if (n?.title && n?.message) {
                        Alert.alert(n.title, n.message);
                    }
                    // Also refresh bookings since a notification usually means a new/changed booking
                    fetchBookings();
                    fetchStats();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [workerProfile, isOnline, fetchBookings, fetchStats]);

    useEffect(() => {
        if (notification) {
            fetchBookings();
        }
    }, [notification, fetchBookings]);

    // Derived state for filtered bookings
    const filteredAndSortedBookings = useMemo(() => {
        let result = [...bookingRequests];

        // Filter by service type
        if (serviceFilter !== 'All Services') {
            result = result.filter(b => b.service_name === serviceFilter);
        }

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'earliest') {
                return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
            } else {
                // closest
                return (a.distance_km || 0) - (b.distance_km || 0);
            }
        });

        return result;
    }, [bookingRequests, sortBy, serviceFilter]);

    // Extract unique service names for the filter dropdown (using simple unique list from current data)
    const availableServices = useMemo(() => {
        const services = new Set(bookingRequests.map(b => b.service_name || 'Service'));
        return ['All Services', ...Array.from(services)];
    }, [bookingRequests]);

    const handleToggleOnline = async (value: boolean) => {
        setIsOnline(value);
        try {
            const { error } = await supabase
                .from('workers_public')
                .update({ is_online: value, last_active: new Date().toISOString() })
                .eq('id', workerProfile?.id);

            if (error) throw error;
            await refreshProfile();
        } catch (err) {
            setIsOnline(!value); // Revert
            Alert.alert('Error', 'Failed to update status');
        }
    };

    const handleAccept = async (bookingId: string) => {
        if (!workerProfile) return;
        setProcessingId(bookingId);
        try {
            const { error } = await (supabase.rpc as any)('accept_booking', {
                p_booking_id: bookingId,
                p_worker_id: workerProfile.id,
            });

            if (error) throw error;
            Alert.alert('Accepted! ✅', 'You have accepted this booking.');
            await fetchBookings();
            await fetchStats();
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to accept booking');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (bookingId: string) => {
        if (!workerProfile) return;
        setProcessingId(bookingId);
        try {
            const { data: booking } = await supabase.from('bookings').select('rejected_worker_ids').eq('id', bookingId).single();
            const rejectedIds = booking?.rejected_worker_ids || [];
            rejectedIds.push(workerProfile.id);

            const { error } = await supabase.from('bookings').update({ rejected_worker_ids: rejectedIds }).eq('id', bookingId);
            if (error) throw error;
            await fetchBookings();
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to reject booking');
        } finally {
            setProcessingId(null);
        }
    };

    const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
        if (!workerProfile) return;
        setProcessingId(bookingId);
        try {
            const { error } = await (supabase.rpc as any)('update_booking_status', {
                p_booking_id: bookingId, p_worker_id: workerProfile.id, p_status: newStatus,
            });
            if (error) throw error;

            const statusLabels: Record<string, string> = {
                en_route: 'Marked as Arrived', in_progress: 'Work Started', completed: 'Job Completed! 🎉',
            };
            Alert.alert('Updated', statusLabels[newStatus] || 'Status updated');
            await fetchBookings();
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to update status');
        } finally {
            setProcessingId(null);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchStats();
        fetchBookings().finally(() => setRefreshing(false));
    };

    const formatDate = (dateStr: string) => {
        try { return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }); } catch { return dateStr; }
    };

    const formatTime = (dateStr: string) => {
        try { return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }); } catch { return ''; }
    };

    const renderSummaryCards = () => (
        <View style={styles.summaryGrid}>
            {/* Total Jobs */}
            <View style={styles.summaryCard}>
                <View style={styles.cardHeaderRow}>
                    <Text style={styles.summaryTitle}>Total Jobs</Text>
                    <Text style={styles.summaryIcon}>💼</Text>
                </View>
                <Text style={styles.summaryValue}>{stats.totalJobs}</Text>
                <Text style={styles.summarySubtitle}>Scheduled bookings</Text>
            </View>

            {/* Rating */}
            <View style={styles.summaryCard}>
                <View style={styles.cardHeaderRow}>
                    <Text style={styles.summaryTitle}>Rating</Text>
                    <Text style={styles.summaryIcon}>⭐</Text>
                </View>
                <Text style={styles.summaryValue}>{stats.rating}</Text>
                <Text style={styles.summarySubtitle}>Average customer rating</Text>
            </View>

            {/* Active Status */}
            <View style={styles.summaryCard}>
                <View style={styles.cardHeaderRow}>
                    <Text style={styles.summaryTitle}>Active Status</Text>
                    <View style={[styles.statusDot, { backgroundColor: isOnline ? '#10b981' : '#64748b' }]} />
                </View>
                <Text style={[styles.summaryValue, { color: isOnline ? '#10b981' : '#94a3b8' }]}>
                    {isOnline ? 'Online' : 'Offline'}
                </Text>
                <Text style={styles.summarySubtitle}>Visible to customers</Text>
            </View>

            {/* Location Status */}
            <TouchableOpacity style={styles.summaryCard} onPress={refreshLocation} activeOpacity={0.7}>
                <View style={styles.cardHeaderRow}>
                    <Text style={[styles.summaryTitle, { color: latitude ? '#34d399' : '#fbbf24' }]}>Location</Text>
                    <Text style={styles.summaryIcon}>{locationLoading ? '⏳' : latitude ? '�' : '⚠️'}</Text>
                </View>
                <Text style={[styles.summaryValue, { fontSize: 16, color: latitude ? '#34d399' : '#fbbf24' }]}>
                    {locationLoading ? 'Detecting...' : latitude ? '✓ Detected' : 'Tap to enable'}
                </Text>
                <Text style={styles.summarySubtitle}>
                    {latitude ? `${latitude.toFixed(4)}, ${longitude?.toFixed(4)}` : locationError || 'Required for bookings'}
                </Text>
            </TouchableOpacity>
        </View>
    );

    const renderFiltersRow = () => (
        <View style={styles.filtersContainer}>
            <View style={styles.filterRowControls}>
                <View style={styles.filterGroup}>
                    <Text style={styles.filterLabel}>Sort By</Text>
                    <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={() => setSortBy(s => s === 'earliest' ? 'closest' : 'earliest')}
                    >
                        <Text style={styles.pickerText}>{sortBy === 'earliest' ? 'Date: Earliest First' : 'Distance: Closest First'}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.filterGroup}>
                    <Text style={styles.filterLabel}>Service Type</Text>
                    <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={() => {
                            // Simple toggle through available services
                            const currentIdx = availableServices.indexOf(serviceFilter);
                            const nextIdx = (currentIdx + 1) % availableServices.length;
                            setServiceFilter(availableServices[nextIdx]);
                        }}
                    >
                        <Text style={styles.pickerText}>{serviceFilter}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.sliderContainer}>
                <View style={styles.sliderHeader}>
                    <Text style={styles.filterLabel}>Distance Range</Text>
                    <Text style={styles.filterLabel}>{distanceFilter} km</Text>
                </View>
                <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={1}
                    maximumValue={100}
                    step={1}
                    value={distanceFilter}
                    onSlidingComplete={setDistanceFilter}
                    minimumTrackTintColor="#10b981"
                    maximumTrackTintColor="#334155"
                    thumbTintColor="#10b981"
                />
                <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabelText}>1 km</Text>
                    <Text style={styles.sliderLabelText}>100 km</Text>
                </View>
            </View>
        </View>
    );

    const renderActiveBooking = () => {
        if (!activeBooking) return null;
        const getNextAction = (s: string) => {
            switch (s) {
                case 'accepted': return { label: '📍 Mark Arrived', next: 'en_route' };
                case 'en_route': return { label: '🔨 Start Work', next: 'in_progress' };
                case 'in_progress': return { label: '✅ Complete Job', next: 'completed' };
                default: return null;
            }
        };
        const action = getNextAction(activeBooking.status);

        return (
            <View style={styles.activeCard}>
                <View style={styles.activeCardHeader}>
                    <Text style={styles.activeCardLabel}>ACTIVE JOB</Text>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusBadgeText}>{activeBooking.status.replace(/_/g, ' ').toUpperCase()}</Text>
                    </View>
                </View>
                <Text style={styles.activeServiceName}>{activeBooking.service_name}</Text>
                <View style={styles.detailsRow}>
                    <Text style={styles.detailText}>📅 {formatDate(activeBooking.scheduled_at)}</Text>
                    <Text style={styles.detailText}>🕐 {formatTime(activeBooking.scheduled_at)}</Text>
                </View>
                {activeBooking.address_line1 && (
                    <Text style={styles.addressText}>📍 {activeBooking.address_line1}{activeBooking.city ? `, ${activeBooking.city}` : ''}</Text>
                )}
                {action && (
                    <TouchableOpacity
                        style={[styles.actionButton, processingId === activeBooking.id && styles.disabledButton]}
                        onPress={() => handleStatusUpdate(activeBooking.id, action.next)}
                        disabled={processingId === activeBooking.id}
                        activeOpacity={0.7}
                    >
                        {processingId === activeBooking.id ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.actionButtonText}>{action.label}</Text>}
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const renderBookingRequest = ({ item }: { item: BookingRequest }) => (
        <View style={styles.requestCard}>
            <View style={styles.requestHeader}>
                <Text style={styles.requestServiceName}>{item.service_name || 'Service'}</Text>
                {item.distance_km != null && <Text style={styles.distanceBadge}>{item.distance_km.toFixed(1)} km</Text>}
            </View>
            <View style={styles.detailsRow}>
                <Text style={styles.detailText}>📅 {formatDate(item.scheduled_at)}</Text>
                <Text style={styles.detailText}>🕐 {formatTime(item.scheduled_at)}</Text>
                {item.total_amount && <Text style={styles.detailText}>💰 ₹{item.total_amount}</Text>}
            </View>
            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={[styles.rejectButton, processingId === item.id && styles.disabledButton]}
                    onPress={() => handleReject(item.id)}
                    disabled={processingId === item.id}
                >
                    <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.acceptButton, processingId === item.id && styles.disabledButton]}
                    onPress={() => handleAccept(item.id)}
                    disabled={processingId === item.id}
                >
                    {processingId === item.id ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.acceptButtonText}>Accept</Text>}
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Dashboard</Text>
                    <Text style={styles.subGreeting}>Welcome back! Here's what's happening in your area.</Text>
                </View>
                {/* Global Toggle to override/assist */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Switch
                        value={isOnline}
                        onValueChange={handleToggleOnline}
                        trackColor={{ false: '#334155', true: '#065f46' }}
                        thumbColor={isOnline ? '#10b981' : '#64748b'}
                    />
                    <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh}>
                        <Text style={styles.refreshBtnText}>🔄 Refresh Feed</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                ListHeaderComponent={
                    <>
                        {renderSummaryCards()}
                        {renderFiltersRow()}
                        {renderActiveBooking()}
                    </>
                }
                data={isOnline ? filteredAndSortedBookings : []}
                keyExtractor={(item) => item.id}
                renderItem={renderBookingRequest}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#10b981" />}
                ListEmptyComponent={
                    !isOnline ? (
                        <View style={styles.emptyContainerDashed}>
                            <Text style={styles.emptyIcon}>🔌</Text>
                            <Text style={styles.emptyTitle}>You are offline</Text>
                            <Text style={styles.emptySubtext}>Toggle online to view jobs</Text>
                        </View>
                    ) : (
                        <View style={styles.emptyContainerDashed}>
                            <Text style={styles.emptyIcon}>🚫</Text>
                            <Text style={styles.emptyTitle}>No matching requests</Text>
                            <Text style={styles.emptySubtext}>Try adjusting your filters to see more results.</Text>
                        </View>
                    )
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    // Header
    header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#1e293b', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    greeting: { fontSize: 24, fontWeight: 'bold', color: '#f8fafc', marginBottom: 4 },
    subGreeting: { fontSize: 13, color: '#94a3b8' },
    refreshBtn: { backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    refreshBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },

    // Summary Cards Grid
    summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
    summaryCard: {
        width: '48%', backgroundColor: '#1e293b', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#334155'
    },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    summaryTitle: { fontSize: 12, fontWeight: '600', color: '#f8fafc' },
    summaryIcon: { fontSize: 16 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    summaryValue: { fontSize: 28, fontWeight: 'bold', color: '#f8fafc', marginBottom: 4 },
    summarySubtitle: { fontSize: 11, color: '#94a3b8' },

    // Filters
    filtersContainer: { backgroundColor: '#1e293b', marginHorizontal: 16, padding: 16, borderRadius: 12, marginBottom: 16 },
    filterRowControls: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    filterGroup: { flex: 1 },
    filterLabel: { fontSize: 12, fontWeight: '600', color: '#f8fafc', marginBottom: 8 },
    pickerButton: { backgroundColor: '#0f172a', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
    pickerText: { color: '#cbd5e1', fontSize: 13 },
    sliderContainer: { marginTop: 4 },
    sliderHeader: { flexDirection: 'row', justifyContent: 'space-between' },
    sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
    sliderLabelText: { fontSize: 11, color: '#64748b' },

    // Empty state
    emptyContainerDashed: {
        margin: 16, padding: 40, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#334155', borderStyle: 'dashed', borderRadius: 16
    },
    emptyIcon: { fontSize: 32, marginBottom: 12, opacity: 0.8 },
    emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#f8fafc', marginBottom: 4 },
    emptySubtext: { fontSize: 13, color: '#94a3b8' },

    // Existing active / request styles
    activeCard: { marginHorizontal: 16, marginBottom: 16, padding: 16, backgroundColor: '#064e3b', borderRadius: 12, borderWidth: 1, borderColor: '#065f46' },
    activeCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    activeCardLabel: { fontSize: 11, fontWeight: '700', color: '#6ee7b7', letterSpacing: 1 },
    statusBadge: { backgroundColor: '#065f46', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusBadgeText: { color: '#6ee7b7', fontSize: 11, fontWeight: '600' },
    activeServiceName: { fontSize: 18, fontWeight: 'bold', color: '#f8fafc', marginBottom: 8 },

    requestCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
    requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    requestServiceName: { fontSize: 16, fontWeight: 'bold', color: '#f8fafc', flex: 1 },
    distanceBadge: { fontSize: 12, color: '#94a3b8', backgroundColor: '#334155', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },

    detailsRow: { flexDirection: 'row', gap: 14, marginBottom: 6 },
    detailText: { fontSize: 13, color: '#94a3b8' },
    addressText: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
    buttonRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
    rejectButton: { flex: 1, borderWidth: 1, borderColor: '#475569', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
    rejectButtonText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
    acceptButton: { flex: 1, backgroundColor: '#10b981', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
    acceptButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    actionButton: { backgroundColor: '#10b981', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 14 },
    actionButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    disabledButton: { opacity: 0.6 },
    listContent: { paddingBottom: 24 },
});
