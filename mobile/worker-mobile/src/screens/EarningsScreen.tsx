import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useUser } from '../hooks/useUser';
import { supabase } from '../services/supabase';

type TimePeriod = 'today' | 'week' | 'month' | 'all';

interface EarningsSummary {
    totalEarnings: number;
    totalJobs: number;
    avgRating: number;
    totalReviews: number;
}

interface CompletedJob {
    id: string;
    services: any;
    service_name?: string;
    total_amount: number;
    scheduled_at: string;
    created_at: string;
}

export function EarningsScreen(): React.JSX.Element {
    const { workerProfile } = useUser();
    const [period, setPeriod] = useState<TimePeriod>('week');
    const [summary, setSummary] = useState<EarningsSummary>({
        totalEarnings: 0,
        totalJobs: 0,
        avgRating: 0,
        totalReviews: 0,
    });
    const [recentJobs, setRecentJobs] = useState<CompletedJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const getDateFilter = (p: TimePeriod): string | null => {
        const now = new Date();
        switch (p) {
            case 'today':
                return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
            case 'week':
                const weekAgo = new Date(now);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return weekAgo.toISOString();
            case 'month':
                const monthAgo = new Date(now);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return monthAgo.toISOString();
            default:
                return null;
        }
    };

    const fetchEarnings = useCallback(async () => {
        if (!workerProfile) return;
        try {
            // Fetch completed bookings
            let query = supabase
                .from('bookings')
                .select('id, total_amount, scheduled_at, created_at, services(name)')
                .eq('worker_id', workerProfile.id)
                .eq('status', 'completed')
                .order('scheduled_at', { ascending: false });

            const dateFilter = getDateFilter(period);
            if (dateFilter) {
                query = query.gte('created_at', dateFilter);
            }

            const { data, error } = await query;
            if (error) throw error;

            const jobs = (data || []).map((j: any) => ({
                ...j,
                service_name: j.services?.name || (Array.isArray(j.services) ? j.services[0]?.name : '') || 'Service',
            }));
            const totalEarnings = jobs.reduce((sum, j) => sum + (j.total_amount || 0), 0);

            setRecentJobs(jobs);
            setSummary(prev => ({
                ...prev,
                totalEarnings,
                totalJobs: jobs.length,
            }));

            // Fetch ratings
            const { data: reviews, error: reviewError } = await supabase
                .from('reviews')
                .select('rating')
                .eq('worker_id', workerProfile.id);

            if (!reviewError && reviews) {
                const avgRating = reviews.length > 0
                    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
                    : 0;
                setSummary(prev => ({
                    ...prev,
                    avgRating: Math.round(avgRating * 10) / 10,
                    totalReviews: reviews.length,
                }));
            }
        } catch (err) {
            console.error('Fetch earnings error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [workerProfile, period]);

    useEffect(() => {
        setLoading(true);
        fetchEarnings();
    }, [fetchEarnings]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchEarnings();
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        } catch { return dateStr; }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#10b981" />
                }
            >
                <Text style={styles.title}>Earnings</Text>

                {/* Time period selector */}
                <View style={styles.periodRow}>
                    {(['today', 'week', 'month', 'all'] as TimePeriod[]).map((p) => (
                        <TouchableOpacity
                            key={p}
                            style={[styles.periodChip, period === p && styles.periodChipActive]}
                            onPress={() => setPeriod(p)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                                {p === 'all' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 60 }} />
                ) : (
                    <>
                        {/* Stats Cards */}
                        <View style={styles.statsGrid}>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>₹{summary.totalEarnings.toLocaleString('en-IN')}</Text>
                                <Text style={styles.statLabel}>Total Earnings</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>{summary.totalJobs}</Text>
                                <Text style={styles.statLabel}>Jobs Completed</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>
                                    {summary.avgRating > 0 ? `⭐ ${summary.avgRating}` : '—'}
                                </Text>
                                <Text style={styles.statLabel}>Avg Rating</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>{summary.totalReviews}</Text>
                                <Text style={styles.statLabel}>Total Reviews</Text>
                            </View>
                        </View>

                        {/* Recent Jobs */}
                        <Text style={styles.sectionTitle}>Recent Completed Jobs</Text>
                        {recentJobs.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No completed jobs in this period</Text>
                            </View>
                        ) : (
                            recentJobs.slice(0, 10).map((job) => (
                                <View key={job.id} style={styles.jobRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.jobName}>{job.service_name || 'Service'}</Text>
                                        <Text style={styles.jobDate}>{formatDate(job.scheduled_at)}</Text>
                                    </View>
                                    <Text style={styles.jobAmount}>₹{job.total_amount || 0}</Text>
                                </View>
                            ))
                        )}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#f8fafc', marginBottom: 16 },
    // Period selector
    periodRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
    periodChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#1e293b',
        borderWidth: 1,
        borderColor: '#334155',
    },
    periodChipActive: { backgroundColor: '#064e3b', borderColor: '#065f46' },
    periodText: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
    periodTextActive: { color: '#6ee7b7', fontWeight: '600' },
    // Stats grid
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
    statCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#1e293b',
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155',
    },
    statValue: { fontSize: 22, fontWeight: 'bold', color: '#f8fafc', marginBottom: 4 },
    statLabel: { fontSize: 12, color: '#94a3b8' },
    // Recent jobs
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#f8fafc', marginBottom: 12 },
    jobRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        borderRadius: 10,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#334155',
    },
    jobName: { fontSize: 14, fontWeight: '600', color: '#f8fafc' },
    jobDate: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
    jobAmount: { fontSize: 16, fontWeight: 'bold', color: '#10b981' },
    // Empty
    emptyContainer: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { fontSize: 14, color: '#64748b' },
});
