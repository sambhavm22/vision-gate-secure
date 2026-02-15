import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
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
    service_name: string;
    status: string;
    booking_date: string;
    booking_time: string;
    duration: number;
    address: string;
    created_at: string;
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
            const now = new Date().toISOString().split('T')[0];
            let query = supabase
                .from('bookings')
                .select('*')
                .eq('user_id', user.id)
                .order('booking_date', { ascending: filterTab === 'upcoming' });

            if (filterTab === 'upcoming') {
                query = query.gte('booking_date', now);
            } else {
                query = query.lt('booking_date', now);
            }

            const { data, error } = await query;

            if (error) {
                console.log('Error fetching bookings:', error.message);
                return;
            }
            setBookings(data || []);
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

    const handleRefresh = () => {
        setRefreshing(true);
        fetchBookings();
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'confirmed':
            case 'assigned':
                return { bg: '#064e3b', text: '#6ee7b7' };
            case 'pending':
            case 'searching':
                return { bg: '#78350f', text: '#fcd34d' };
            case 'completed':
                return { bg: '#1e293b', text: '#94a3b8' };
            case 'cancelled':
                return { bg: '#7f1d1d', text: '#fca5a5' };
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

    const renderBookingCard = ({ item }: { item: Booking }) => {
        const statusColor = getStatusColor(item.status);
        return (
            <View style={styles.bookingCard}>
                <View style={styles.cardHeader}>
                    <Text style={styles.serviceName} numberOfLines={1}>{item.service_name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                        <Text style={[styles.statusText, { color: statusColor.text }]}>
                            {item.status}
                        </Text>
                    </View>
                </View>
                <View style={styles.cardDetails}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailIcon}>📅</Text>
                        <Text style={styles.detailText}>{formatDate(item.booking_date)}</Text>
                    </View>
                    {item.booking_time ? (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailIcon}>🕐</Text>
                            <Text style={styles.detailText}>{item.booking_time}</Text>
                        </View>
                    ) : null}
                    {item.duration ? (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailIcon}>⏱️</Text>
                            <Text style={styles.detailText}>{item.duration}h</Text>
                        </View>
                    ) : null}
                </View>
                {item.address ? (
                    <View style={styles.addressRow}>
                        <Text style={styles.detailIcon}>📍</Text>
                        <Text style={styles.addressText} numberOfLines={1}>{item.address}</Text>
                    </View>
                ) : null}
            </View>
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
});
