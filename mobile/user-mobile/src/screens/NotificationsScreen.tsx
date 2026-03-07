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
import { useUser } from '../hooks/useUser';
import { supabase } from '../services/supabase';

interface NotificationItem {
    id: string;
    title: string;
    message: string;
    is_read: boolean;
    priority: string | null;
    type: string | null;
    booking_id: string | null;
    metadata: any;
    created_at: string;
}

export function NotificationsScreen(): React.JSX.Element {
    const { user } = useUser();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = useCallback(async () => {
        if (!user?.id) return;
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setNotifications(data || []);
        } catch (err) {
            console.error('Fetch notifications error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Real-time subscription for new notifications
    useEffect(() => {
        if (!user?.id) return;

        const channel = supabase
            .channel('user-notifications-list')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    fetchNotifications();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id, fetchNotifications]);

    const markAsRead = async (notification: NotificationItem) => {
        if (notification.is_read) return;
        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notification.id);

            setNotifications(prev =>
                prev.map(n => (n.id === notification.id ? { ...n, is_read: true } : n))
            );
        } catch (err) {
            // Silent fail
        }
    };

    const markAllAsRead = async () => {
        if (!user?.id) return;
        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (err) {
            // Silent fail
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const getIcon = (type: string | null) => {
        switch (type) {
            case 'booking_accepted': return '✅';
            case 'worker_en_route': return '🚗';
            case 'booking_completed': return '🎉';
            case 'booking_cancelled': return '❌';
            case 'worker_searching': return '🔍';
            case 'worker_unassigned': return '🔄';
            default: return '🔔';
        }
    };

    const formatTime = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMin = Math.floor(diffMs / 60000);
            const diffHrs = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMin < 1) return 'Just now';
            if (diffMin < 60) return `${diffMin}m ago`;
            if (diffHrs < 24) return `${diffHrs}h ago`;
            if (diffDays < 7) return `${diffDays}d ago`;
            return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        } catch {
            return '';
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const renderNotification = ({ item }: { item: NotificationItem }) => (
        <TouchableOpacity
            style={[styles.notifCard, !item.is_read && styles.notifCardUnread]}
            activeOpacity={0.7}
            onPress={() => markAsRead(item)}
        >
            <View style={styles.notifRow}>
                <Text style={styles.notifIcon}>{getIcon(item.type)}</Text>
                <View style={styles.notifContent}>
                    <View style={styles.notifHeader}>
                        <Text style={[styles.notifTitle, !item.is_read && styles.notifTitleUnread]} numberOfLines={1}>
                            {item.title}
                        </Text>
                        {!item.is_read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
                    <Text style={styles.notifTime}>{formatTime(item.created_at)}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.headerRow}>
                <Text style={styles.title}>Notifications</Text>
                {unreadCount > 0 && (
                    <TouchableOpacity onPress={markAllAsRead} activeOpacity={0.7}>
                        <Text style={styles.markAllBtn}>Mark all read</Text>
                    </TouchableOpacity>
                )}
            </View>

            {unreadCount > 0 && (
                <View style={styles.unreadBanner}>
                    <Text style={styles.unreadBannerText}>
                        {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                    </Text>
                </View>
            )}

            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={renderNotification}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6366f1" />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>🔔</Text>
                            <Text style={styles.emptyTitle}>No notifications yet</Text>
                            <Text style={styles.emptySubtext}>You'll see booking updates here</Text>
                        </View>
                    ) : null
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#f8fafc' },
    markAllBtn: { fontSize: 13, color: '#6366f1', fontWeight: '600' },
    unreadBanner: { backgroundColor: '#312e81', marginHorizontal: 16, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginBottom: 8 },
    unreadBannerText: { color: '#a5b4fc', fontSize: 12, fontWeight: '600' },
    listContent: { paddingHorizontal: 16, paddingBottom: 32 },
    notifCard: {
        backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 8,
        borderWidth: 1, borderColor: '#334155',
    },
    notifCardUnread: { borderColor: '#6366f1', borderLeftWidth: 3 },
    notifRow: { flexDirection: 'row', gap: 12 },
    notifIcon: { fontSize: 20, marginTop: 2 },
    notifContent: { flex: 1 },
    notifHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    notifTitle: { fontSize: 14, fontWeight: '600', color: '#cbd5e1', flex: 1 },
    notifTitleUnread: { color: '#f8fafc' },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366f1' },
    notifMessage: { fontSize: 13, color: '#94a3b8', lineHeight: 18, marginBottom: 4 },
    notifTime: { fontSize: 11, color: '#475569', marginTop: 4 },
    emptyContainer: { alignItems: 'center', paddingVertical: 60 },
    emptyIcon: { fontSize: 40, marginBottom: 12, opacity: 0.6 },
    emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#f8fafc', marginBottom: 4 },
    emptySubtext: { fontSize: 13, color: '#94a3b8' },
});
