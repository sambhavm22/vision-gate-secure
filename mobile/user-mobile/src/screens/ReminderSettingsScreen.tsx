/**
 * Reminder Settings Screen (User)
 * Toggle booking reminders on/off
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    SafeAreaView,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';
import { useUser } from '../hooks/useUser';
import { supabase } from '../services/supabase';

export function ReminderSettingsScreen(): React.JSX.Element {
    const { user } = useUser();
    const [enabled, setEnabled] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchPrefs = useCallback(async () => {
        if (!user?.id) return;
        const { data } = await supabase
            .from('reminder_preferences')
            .select('reminders_enabled')
            .eq('user_id', user.id)
            .single();
        if (data) setEnabled(data.reminders_enabled);
        setLoading(false);
    }, [user?.id]);

    useEffect(() => { fetchPrefs(); }, [fetchPrefs]);

    const toggleReminders = async (value: boolean) => {
        if (!user?.id) return;
        setEnabled(value);
        setSaving(true);
        try {
            const { error } = await supabase
                .from('reminder_preferences')
                .upsert({ user_id: user.id, reminders_enabled: value }, { onConflict: 'user_id' });
            if (error) throw error;
        } catch {
            setEnabled(!value); // revert on failure
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Main Toggle Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.iconCircle}>
                            <Text style={styles.iconText}>🔔</Text>
                        </View>
                        <View style={styles.cardInfo}>
                            <Text style={styles.cardTitle}>Booking Reminders</Text>
                            <Text style={styles.cardSubtitle}>
                                Get notified 1 hour before your scheduled service
                            </Text>
                        </View>
                        <Switch
                            value={enabled}
                            onValueChange={toggleReminders}
                            trackColor={{ false: '#334155', true: '#22c55e' }}
                            thumbColor={enabled ? '#fff' : '#94a3b8'}
                            disabled={saving}
                        />
                    </View>
                </View>

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>How reminders work</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoBullet}>⏰</Text>
                        <Text style={styles.infoText}>
                            You'll receive a push notification 1 hour before your booking
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoBullet}>🚫</Text>
                        <Text style={styles.infoText}>
                            Cancelled bookings won't trigger reminders
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoBullet}>🔄</Text>
                        <Text style={styles.infoText}>
                            Reminders auto-adjust when bookings are rescheduled
                        </Text>
                    </View>
                </View>

                {/* Status */}
                <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: enabled ? '#22c55e' : '#64748b' }]} />
                    <Text style={styles.statusText}>
                        Reminders are {enabled ? 'active' : 'paused'}
                    </Text>
                    {saving && <ActivityIndicator size="small" color="#3b82f6" style={{ marginLeft: 8 }} />}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: 20 },
    card: {
        backgroundColor: '#1e293b', borderRadius: 16, padding: 20,
        borderWidth: 1, borderColor: '#334155', marginBottom: 20,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    iconCircle: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        justifyContent: 'center', alignItems: 'center', marginRight: 14,
    },
    iconText: { fontSize: 22 },
    cardInfo: { flex: 1, marginRight: 12 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#f8fafc', marginBottom: 4 },
    cardSubtitle: { fontSize: 13, color: '#94a3b8', lineHeight: 18 },
    infoCard: {
        backgroundColor: '#1e293b', borderRadius: 16, padding: 20,
        borderWidth: 1, borderColor: '#334155', marginBottom: 20,
    },
    infoTitle: { fontSize: 14, fontWeight: '700', color: '#cbd5e1', marginBottom: 16 },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
    infoBullet: { fontSize: 16, marginRight: 12, marginTop: 1 },
    infoText: { fontSize: 14, color: '#94a3b8', flex: 1, lineHeight: 20 },
    statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    statusText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
});
