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

type FilterTab = 'active' | 'completed';

interface Job {
    id: string;
    service_name: string;
    status: string;
    scheduled_at: string;
    duration_minutes: number;
    total_amount: number | null;
    notes: string | null;
    created_at: string;
    customer_name?: string;
    address_line1?: string;
    city?: string;
}

export function MyJobsScreen(): React.JSX.Element {
    const { workerProfile } = useUser();
    const [filterTab, setFilterTab] = useState<FilterTab>('active');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchJobs = useCallback(async () => {
        if (!workerProfile) return;
        try {
            const activeStatuses = ['accepted', 'en_route', 'in_progress', 'assigned'];
            const completedStatuses = ['completed', 'cancelled'];

            const statusFilter = filterTab === 'active' ? activeStatuses : completedStatuses;

            const { data, error } = await supabase
                .from('bookings')
                .select('*, services(name), addresses(address_line1, city), profiles!bookings_customer_id_fkey(full_name)')
                .eq('worker_id', workerProfile.id)
                .in('status', statusFilter)
                .order('scheduled_at', { ascending: filterTab === 'active' });

            if (error) throw error;

            const mapped = (data || []).map((item: any) => ({
                ...item,
                service_name: item.services?.name || item.service_name || 'Service',
                customer_name: item.profiles?.full_name || 'Customer',
                address_line1: item.addresses?.address_line1,
                city: item.addresses?.city,
            }));

            setJobs(mapped);
        } catch (err) {
            console.error('Fetch jobs error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [workerProfile, filterTab]);

    useEffect(() => {
        setLoading(true);
        fetchJobs();
    }, [fetchJobs]);

    // Real-time subscription
    useEffect(() => {
        if (!workerProfile) return;

        const channel = supabase
            .channel('worker-my-jobs')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'bookings',
                    filter: `worker_id=eq.${workerProfile.id}`,
                },
                () => {
                    fetchJobs();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [workerProfile, fetchJobs]);

    const handleStatusUpdate = async (jobId: string, newStatus: string) => {
        if (!workerProfile) return;
        setProcessingId(jobId);
        try {
            const { error } = await (supabase.rpc as any)('update_booking_status', {
                p_booking_id: jobId,
                p_worker_id: workerProfile.id,
                p_status: newStatus,
            });
            if (error) throw error;
            Alert.alert('Updated ✅', `Status changed to ${newStatus.replace(/_/g, ' ')}`);
            await fetchJobs();
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to update');
        } finally {
            setProcessingId(null);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchJobs();
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
        } catch { return dateStr; }
    };

    const formatTime = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch { return ''; }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'accepted': case 'assigned': return { bg: '#064e3b', text: '#6ee7b7' };
            case 'en_route': return { bg: '#1e3a5f', text: '#93c5fd' };
            case 'in_progress': return { bg: '#78350f', text: '#fcd34d' };
            case 'completed': return { bg: '#1e293b', text: '#94a3b8' };
            case 'cancelled': return { bg: '#7f1d1d', text: '#fca5a5' };
            default: return { bg: '#334155', text: '#cbd5e1' };
        }
    };

    const getNextAction = (status: string) => {
        switch (status) {
            case 'accepted': case 'assigned': return { label: '📍 Arrived', next: 'en_route' };
            case 'en_route': return { label: '🔨 Start Work', next: 'in_progress' };
            case 'in_progress': return { label: '✅ Complete', next: 'completed' };
            default: return null;
        }
    };

    const renderJob = ({ item }: { item: Job }) => {
        const statusColor = getStatusColor(item.status);
        const action = getNextAction(item.status);

        return (
            <View style={styles.jobCard}>
                <View style={styles.cardHeader}>
                    <Text style={styles.serviceName}>{item.service_name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                        <Text style={[styles.statusText, { color: statusColor.text }]}>
                            {item.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </Text>
                    </View>
                </View>

                {item.customer_name && (
                    <Text style={styles.customerText}>👤 {item.customer_name}</Text>
                )}

                <View style={styles.detailsRow}>
                    <Text style={styles.detailText}>📅 {formatDate(item.scheduled_at)}</Text>
                    <Text style={styles.detailText}>🕐 {formatTime(item.scheduled_at)}</Text>
                </View>

                {item.address_line1 && (
                    <Text style={styles.addressText}>
                        📍 {item.address_line1}{item.city ? `, ${item.city}` : ''}
                    </Text>
                )}

                {item.total_amount && (
                    <Text style={styles.amountText}>₹{item.total_amount}</Text>
                )}

                {action && (
                    <TouchableOpacity
                        style={[styles.actionButton, processingId === item.id && styles.disabledButton]}
                        onPress={() => handleStatusUpdate(item.id, action.next)}
                        disabled={processingId === item.id}
                        activeOpacity={0.7}
                    >
                        {processingId === item.id ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.actionButtonText}>{action.label}</Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My Jobs</Text>
            </View>

            <View style={styles.tabBar}>
                {(['active', 'completed'] as FilterTab[]).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, filterTab === tab && styles.tabActive]}
                        onPress={() => setFilterTab(tab)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.tabText, filterTab === tab && styles.tabTextActive]}>
                            {tab === 'active' ? 'Active' : 'History'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#10b981" />
                </View>
            ) : (
                <FlatList
                    data={jobs}
                    keyExtractor={(item) => item.id}
                    renderItem={renderJob}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#10b981" />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>{filterTab === 'active' ? '📋' : '📜'}</Text>
                            <Text style={styles.emptyText}>
                                {filterTab === 'active' ? 'No active jobs' : 'No completed jobs yet'}
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#f8fafc' },
    tabBar: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 10 },
    tab: {
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#1e293b',
        borderWidth: 1,
        borderColor: '#334155',
    },
    tabActive: { backgroundColor: '#064e3b', borderColor: '#065f46' },
    tabText: { fontSize: 14, color: '#94a3b8', fontWeight: '500' },
    tabTextActive: { color: '#6ee7b7', fontWeight: '600' },
    // Job card
    jobCard: {
        backgroundColor: '#1e293b',
        borderRadius: 14,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    serviceName: { fontSize: 16, fontWeight: 'bold', color: '#f8fafc', flex: 1, marginRight: 10 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 12, fontWeight: '600' },
    customerText: { fontSize: 13, color: '#94a3b8', marginBottom: 6 },
    detailsRow: { flexDirection: 'row', gap: 14, marginBottom: 6 },
    detailText: { fontSize: 13, color: '#94a3b8' },
    addressText: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
    amountText: { fontSize: 15, fontWeight: '600', color: '#10b981', marginTop: 6 },
    actionButton: {
        backgroundColor: '#10b981',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 12,
    },
    actionButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    disabledButton: { opacity: 0.6 },
    // States
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { alignItems: 'center', paddingVertical: 60 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 16, color: '#94a3b8' },
    listContent: { paddingBottom: 24, flexGrow: 1 },
});
