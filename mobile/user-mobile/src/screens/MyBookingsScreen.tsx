import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useUser } from '../hooks/useUser';
import { supabase } from '../services/supabase';

type MainTab = 'bookings' | 'recurring';
type FilterTab = 'upcoming' | 'past';

interface Booking {
    id: string;
    service_id: number;
    status: string;
    scheduled_at: string;
    duration_minutes: number | null;
    total_amount: number | null;
    notes: string | null;
    created_at: string;
    address_id: string | null;
    services: { name: string } | null;
    addresses: { address_line1: string; city: string } | null;
    workers_public: { full_name: string } | null;
    transactions: { payment_method: string; status: string }[] | null;
}

export function MyBookingsScreen(): React.JSX.Element {
    const { user } = useUser();
    const navigation = useNavigation<any>();
    const [mainTab, setMainTab] = useState<MainTab>('bookings');
    const [filterTab, setFilterTab] = useState<FilterTab>('upcoming');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchBookings = useCallback(async () => {
        if (!user) return;
        try {
            const now = new Date().toISOString();
            let query = supabase
                .from('bookings')
                .select('*, services(name), addresses(address_line1, city), workers_public(full_name), transactions(payment_method, status)')
                .eq('customer_id', user.id)
                .order('scheduled_at', { ascending: filterTab === 'upcoming' });

            if (filterTab === 'upcoming') {
                query = query.gte('scheduled_at', now);
            } else {
                query = query.lt('scheduled_at', now);
            }

            const { data, error } = await query;

            if (error) {
                console.log('Error fetching bookings:', error.message);
                return;
            }
            setBookings((data as Booking[]) || []);
        } catch (err) {
            console.log('Fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user, filterTab]);

    useEffect(() => {
        setLoading(true);
        fetchBookings();
    }, [fetchBookings]);

    // Real-time subscription: auto-refresh when booking status changes
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('user-bookings-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'bookings',
                    filter: `customer_id=eq.${user.id}`,
                },
                () => {
                    // Auto-refresh bookings when any booking for this user is updated
                    fetchBookings();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'bookings',
                    filter: `customer_id=eq.${user.id}`,
                },
                () => {
                    fetchBookings();
                }
            )
            // Listen for new notifications targeted at this user (in-app alert)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload: any) => {
                    const n = payload.new;
                    if (n?.title && n?.message) {
                        Alert.alert(n.title, n.message);
                    }
                    fetchBookings();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, fetchBookings]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchBookings();
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'confirmed':
            case 'assigned':
            case 'accepted':
            case 'matched':
                return { bg: '#064e3b', text: '#6ee7b7' };
            case 'pending':
            case 'searching':
            case 'requested':
                return { bg: '#78350f', text: '#fcd34d' };
            case 'completed':
            case 'paid':
                return { bg: '#1e293b', text: '#94a3b8' };
            case 'cancelled':
                return { bg: '#7f1d1d', text: '#fca5a5' };
            case 'in_progress':
            case 'en_route':
                return { bg: '#1e3a5f', text: '#93c5fd' };
            default:
                return { bg: '#334155', text: '#cbd5e1' };
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
            });
        } catch {
            return dateStr;
        }
    };

    const formatTime = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            });
        } catch {
            return '';
        }
    };

    const formatStatus = (status: string) => {
        return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    const renderBookingCard = ({ item }: { item: Booking }) => {
        const statusColor = getStatusColor(item.status);
        const serviceName = item.services?.name || 'Service';
        const addressText = item.addresses
            ? `${item.addresses.address_line1}${item.addresses.city ? ', ' + item.addresses.city : ''}`
            : null;

        const handlePress = () => {
            const workerName = item.workers_public?.full_name || null;
            const paymentMethod = item.transactions?.find(t => t.status === 'success')?.payment_method || null;
            navigation.navigate('BookingDetails', {
                bookingId: item.id,
                serviceName,
                status: item.status,
                scheduledAt: item.scheduled_at,
                durationMinutes: item.duration_minutes,
                totalAmount: item.total_amount,
                address: addressText,
                workerName,
                paymentMethod,
            });
        };

        return (
            <TouchableOpacity
                style={styles.bookingCard}
                onPress={handlePress}
                activeOpacity={0.7}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.serviceName} numberOfLines={1}>{serviceName}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                        <Text style={[styles.statusText, { color: statusColor.text }]}>
                            {formatStatus(item.status)}
                        </Text>
                    </View>
                </View>
                <View style={styles.cardDetails}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailIcon}>📅</Text>
                        <Text style={styles.detailText}>{formatDate(item.scheduled_at)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailIcon}>🕐</Text>
                        <Text style={styles.detailText}>{formatTime(item.scheduled_at)}</Text>
                    </View>
                    {item.duration_minutes ? (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailIcon}>⏱️</Text>
                            <Text style={styles.detailText}>
                                {item.duration_minutes >= 60
                                    ? `${Math.floor(item.duration_minutes / 60)}h${item.duration_minutes % 60 > 0 ? ` ${item.duration_minutes % 60}m` : ''}`
                                    : `${item.duration_minutes}m`}
                            </Text>
                        </View>
                    ) : null}
                    {item.total_amount ? (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailIcon}>💰</Text>
                            <Text style={styles.detailText}>₹{item.total_amount}</Text>
                        </View>
                    ) : null}
                </View>
                {addressText ? (
                    <View style={styles.addressRow}>
                        <Text style={styles.detailIcon}>📍</Text>
                        <Text style={styles.addressText} numberOfLines={1}>{addressText}</Text>
                    </View>
                ) : null}

                {/* Cancel button for upcoming / active bookings */}
                {filterTab === 'upcoming' && item.status !== 'cancelled' && item.status !== 'completed' && item.status !== 'paid' && (
                    <TouchableOpacity
                        style={styles.cancelCardButton}
                        onPress={(e) => {
                            e.stopPropagation();
                            Alert.alert(
                                'Cancel Booking',
                                'Are you sure you want to cancel this booking?',
                                [
                                    { text: 'No', style: 'cancel' },
                                    {
                                        text: 'Yes, Cancel',
                                        style: 'destructive',
                                        onPress: async () => {
                                            const { error } = await supabase
                                                .from('bookings')
                                                .update({ status: 'cancelled' })
                                                .eq('id', item.id);
                                            if (error) {
                                                Alert.alert('Error', 'Failed to cancel booking.');
                                            } else {
                                                Alert.alert('Cancelled', 'Booking has been cancelled.');
                                                fetchBookings();
                                            }
                                        },
                                    },
                                ]
                            );
                        }}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.cancelCardButtonText}>Cancel Booking</Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
                {filterTab === 'upcoming'
                    ? 'No upcoming bookings found.'
                    : 'No past bookings found.'}
            </Text>
            <TouchableOpacity
                style={styles.emptyButton}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
            >
                <Text style={styles.emptyButtonText}>Book Your First Service</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>My Bookings</Text>
                        <Text style={styles.subtitle}>View and manage your service bookings</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={handleRefresh}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.refreshIcon}>🔄</Text>
                        <Text style={styles.refreshText}>Refresh Feed</Text>
                    </TouchableOpacity>
                </View>

                {/* Main Tabs: Bookings / Recurring Series */}
                <View style={styles.mainTabBar}>
                    <TouchableOpacity
                        style={[styles.mainTab, mainTab === 'bookings' && styles.mainTabActive]}
                        onPress={() => setMainTab('bookings')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.mainTabText, mainTab === 'bookings' && styles.mainTabTextActive]}>
                            Bookings
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.mainTab, mainTab === 'recurring' && styles.mainTabActive]}
                        onPress={() => setMainTab('recurring')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.mainTabText, mainTab === 'recurring' && styles.mainTabTextActive]}>
                            Recurring Series
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Filter Tabs: Upcoming / Past */}
                <View style={styles.filterTabBar}>
                    <TouchableOpacity
                        style={[styles.filterTab, filterTab === 'upcoming' && styles.filterTabActive]}
                        onPress={() => setFilterTab('upcoming')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.filterTabText, filterTab === 'upcoming' && styles.filterTabTextActive]}>
                            Upcoming
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterTab, filterTab === 'past' && styles.filterTabActive]}
                        onPress={() => setFilterTab('past')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.filterTabText, filterTab === 'past' && styles.filterTabTextActive]}>
                            Past
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Booking List */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#10b981" />
                    </View>
                ) : (
                    <FlatList
                        data={bookings}
                        keyExtractor={item => item.id}
                        renderItem={renderBookingCard}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={renderEmptyState}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                                tintColor="#10b981"
                                colors={['#10b981']}
                            />
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    // ── Header ──
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#f8fafc',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: '#94a3b8',
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#334155',
    },
    refreshIcon: {
        fontSize: 14,
        marginRight: 6,
    },
    refreshText: {
        fontSize: 13,
        color: '#f8fafc',
        fontWeight: '500',
    },
    // ── Main Tabs ──
    mainTabBar: {
        flexDirection: 'row',
        backgroundColor: '#1e293b',
        borderRadius: 10,
        padding: 4,
        marginBottom: 12,
        alignSelf: 'flex-start',
    },
    mainTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    mainTabActive: {
        backgroundColor: '#0f172a', // Darker active state
    },
    mainTabText: {
        fontSize: 14,
        color: '#94a3b8',
        fontWeight: '500',
    },
    mainTabTextActive: {
        color: '#f8fafc',
        fontWeight: '600',
    },
    // ── Filter Tabs ──
    filterTabBar: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    filterTab: {
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#1e293b',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#334155',
    },
    filterTabActive: {
        borderColor: '#1e293b',
        backgroundColor: '#1e293b', // Matching screenshot - seamless look
    },
    filterTabText: {
        fontSize: 14,
        color: '#94a3b8',
        fontWeight: '500',
    },
    filterTabTextActive: {
        color: '#f8fafc',
        fontWeight: '600',
    },
    // ── List ──
    listContent: {
        paddingBottom: 24,
        flexGrow: 1,
    },
    // ── Booking Card ──
    bookingCard: {
        backgroundColor: '#1e293b',
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#f8fafc',
        flex: 1,
        marginRight: 10,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    cardDetails: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
        marginBottom: 6,
    },
    detailIcon: {
        fontSize: 13,
        marginRight: 5,
    },
    detailText: {
        fontSize: 13,
        color: '#94a3b8',
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#334155',
    },
    addressText: {
        fontSize: 13,
        color: '#94a3b8',
        flex: 1,
    },
    // ── Loading ──
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // ── Empty State ──
    emptyContainer: {
        flex: 1,
        backgroundColor: '#1e293b',
        borderRadius: 14,
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
        minHeight: 200, // Ensure detail card height
    },
    emptyText: {
        fontSize: 15,
        color: '#94a3b8',
        marginBottom: 20,
        textAlign: 'center',
    },
    emptyButton: {
        backgroundColor: '#10b981',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    emptyButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    cancelCardButton: {
        borderTopWidth: 1,
        borderTopColor: '#334155',
        marginTop: 12,
        paddingTop: 12,
        alignItems: 'center',
    },
    cancelCardButtonText: {
        color: '#ef4444',
        fontSize: 14,
        fontWeight: '600',
    },
});
