/**
 * My Disputes Screen
 * Shows list of user's disputes with status badges
 */

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
    FlatList,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { RootStackParamList } from '../App';
import { useUser } from '../hooks/useUser';
import { supabase } from '../services/supabase';

type Props = NativeStackScreenProps<RootStackParamList, 'MyDisputes'>;

interface Dispute {
    id: string;
    booking_id: string;
    issue_type: string;
    status: string;
    description: string;
    created_at: string;
    bookings?: { scheduled_at: string; services?: { name: string } };
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
    open: { label: 'Open', bg: '#78350f', color: '#fcd34d' },
    in_review: { label: 'In Review', bg: '#1e3a5f', color: '#7dd3fc' },
    resolved: { label: 'Resolved', bg: '#064e3b', color: '#6ee7b7' },
    rejected: { label: 'Rejected', bg: '#7f1d1d', color: '#fca5a5' },
};

const ISSUE_ICONS: Record<string, string> = {
    service_quality: '⭐',
    no_show: '🚫',
    payment: '💳',
    damage: '🔨',
    other: '📝',
};

export function MyDisputesScreen({ navigation }: Props): React.JSX.Element {
    const { user } = useUser();
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchDisputes = useCallback(async () => {
        if (!user?.id) return;
        try {
            const { data, error } = await supabase
                .from('disputes')
                .select('*, bookings(scheduled_at, services(name))')
                .or(`user_id.eq.${user.id},raised_by.eq.${user.id}`)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDisputes(data || []);
        } catch (err) {
            console.error('Fetch disputes error:', err);
        }
    }, [user?.id]);

    useEffect(() => {
        setLoading(true);
        fetchDisputes().finally(() => setLoading(false));
    }, [fetchDisputes]);

    // Real-time subscription for status updates
    useEffect(() => {
        if (!user?.id) return;
        const channel = supabase
            .channel('user-disputes-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'disputes' }, () => {
                fetchDisputes();
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [user?.id, fetchDisputes]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchDisputes().finally(() => setRefreshing(false));
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    const renderDispute = ({ item }: { item: Dispute }) => {
        const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.open;
        const serviceName = (item as any).bookings?.services?.name || 'Service';

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('DisputeDetail', { disputeId: item.id })}
                activeOpacity={0.7}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.cardLeft}>
                        <Text style={styles.issueIcon}>{ISSUE_ICONS[item.issue_type] || '📝'}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>
                                {item.issue_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </Text>
                            <Text style={styles.cardService}>{serviceName}</Text>
                        </View>
                    </View>
                    <View style={[styles.badge, { backgroundColor: statusCfg.bg }]}>
                        <Text style={[styles.badgeText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
                    </View>
                </View>
                <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
                <Text style={styles.cardDate}>Raised on {formatDate(item.created_at)}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={disputes}
                keyExtractor={item => item.id}
                renderItem={renderDispute}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6366f1" />}
                ListEmptyComponent={
                    loading ? null : (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>✅</Text>
                            <Text style={styles.emptyTitle}>No disputes</Text>
                            <Text style={styles.emptySubtext}>You haven't raised any issues yet.</Text>
                        </View>
                    )
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    listContent: { padding: 16, paddingBottom: 32 },
    card: {
        backgroundColor: '#1e293b', borderRadius: 14, padding: 16,
        marginBottom: 12, borderWidth: 1, borderColor: '#334155',
    },
    cardHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10,
    },
    cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
    issueIcon: { fontSize: 24 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: '#f8fafc' },
    cardService: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    cardDescription: { fontSize: 13, color: '#94a3b8', lineHeight: 19, marginBottom: 8 },
    cardDate: { fontSize: 11, color: '#64748b' },
    emptyContainer: {
        alignItems: 'center', justifyContent: 'center', paddingVertical: 80,
    },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#f8fafc', marginBottom: 4 },
    emptySubtext: { fontSize: 14, color: '#94a3b8' },
});
