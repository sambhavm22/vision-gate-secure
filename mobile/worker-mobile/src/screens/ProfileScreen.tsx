import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useUser } from '../hooks/useUser';
import { supabase } from '../services/supabase';

// Available services fetched from the services table
const ALL_SERVICES = ['Everyday Cleaning', 'Expert Cook', 'Laundry'];

export function ProfileScreen(): React.JSX.Element {
    const { user, workerProfile, refreshProfile } = useUser();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState(workerProfile?.full_name || '');
    const [phone, setPhone] = useState(workerProfile?.phone || '');
    const [bio, setBio] = useState(workerProfile?.bio || '');
    const [selectedServices, setSelectedServices] = useState<string[]>(
        workerProfile?.service_types || []
    );

    // Keep local state in sync when workerProfile refreshes
    useEffect(() => {
        if (workerProfile) {
            setName(workerProfile.full_name || '');
            setPhone(workerProfile.phone || '');
            setBio(workerProfile.bio || '');
            setSelectedServices(workerProfile.service_types || []);
        }
    }, [workerProfile]);

    // Real-time subscription so online status updates from Dashboard are reflected here
    useEffect(() => {
        if (!workerProfile) return;
        const channel = supabase
            .channel('profile-status-sync')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'workers_public',
                    filter: `id=eq.${workerProfile.id}`,
                },
                () => {
                    refreshProfile();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [workerProfile?.id, refreshProfile]);

    const toggleService = (service: string) => {
        setSelectedServices(prev =>
            prev.includes(service)
                ? prev.filter(s => s !== service)
                : [...prev, service]
        );
    };

    const handleSave = async () => {
        if (!workerProfile) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('workers_public')
                .update({
                    full_name: name,
                    phone,
                    bio,
                    service_types: selectedServices,
                })
                .eq('id', workerProfile.id);

            if (error) throw error;
            await refreshProfile();
            setEditing(false);
            Alert.alert('Saved ✅', 'Profile updated successfully.');
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    await supabase.auth.signOut();
                },
            },
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Profile</Text>
                    {!editing ? (
                        <TouchableOpacity onPress={() => setEditing(true)} activeOpacity={0.7}>
                            <Text style={styles.editButton}>✏️ Edit</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={() => { setEditing(false); setSelectedServices(workerProfile?.service_types || []); }} activeOpacity={0.7}>
                            <Text style={styles.cancelButton}>Cancel</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Avatar / Name */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {(workerProfile?.full_name || 'W').charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <Text style={styles.profileName}>{workerProfile?.full_name || 'Worker'}</Text>
                    <Text style={styles.profileEmail}>{user?.email || user?.phone || ''}</Text>
                    {workerProfile?.is_verified && (
                        <View style={styles.verifiedBadge}>
                            <Text style={styles.verifiedText}>✅ Verified</Text>
                        </View>
                    )}
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>
                            {workerProfile?.rating ? `⭐ ${workerProfile.rating}` : '—'}
                        </Text>
                        <Text style={styles.statLabel}>Rating</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{workerProfile?.total_reviews || 0}</Text>
                        <Text style={styles.statLabel}>Reviews</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>
                            {workerProfile?.is_online ? '🟢' : '🔴'}
                        </Text>
                        <Text style={styles.statLabel}>
                            {workerProfile?.is_online ? 'Online' : 'Offline'}
                        </Text>
                    </View>
                </View>

                {/* Form */}
                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Full Name</Text>
                        {editing ? (
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="Your name"
                                placeholderTextColor="#64748b"
                            />
                        ) : (
                            <Text style={styles.fieldValue}>{workerProfile?.full_name || '—'}</Text>
                        )}
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Phone</Text>
                        {editing ? (
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="Phone number"
                                placeholderTextColor="#64748b"
                                keyboardType="phone-pad"
                            />
                        ) : (
                            <Text style={styles.fieldValue}>{workerProfile?.phone || '—'}</Text>
                        )}
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Bio</Text>
                        {editing ? (
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={bio}
                                onChangeText={setBio}
                                placeholder="Short bio about yourself"
                                placeholderTextColor="#64748b"
                                multiline
                                numberOfLines={3}
                            />
                        ) : (
                            <Text style={styles.fieldValue}>{workerProfile?.bio || '—'}</Text>
                        )}
                    </View>
                </View>

                {/* Services Section */}
                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>My Services</Text>
                    <Text style={styles.sectionSubtitle}>
                        {editing
                            ? 'Tap to select the services you can provide. Bookings will be matched based on your selected services.'
                            : 'These are the services you currently offer. Tap "Edit" to change them.'}
                    </Text>

                    <View style={styles.servicesGrid}>
                        {ALL_SERVICES.map(service => {
                            const isSelected = selectedServices.includes(service);
                            return (
                                <TouchableOpacity
                                    key={service}
                                    style={[
                                        styles.serviceChip,
                                        isSelected && styles.serviceChipSelected,
                                        !editing && styles.serviceChipDisabled,
                                    ]}
                                    onPress={() => { if (editing) toggleService(service); }}
                                    activeOpacity={editing ? 0.7 : 1}
                                >
                                    <Text style={styles.serviceIcon}>
                                        {service === 'Everyday Cleaning' ? '🧹' : service === 'Expert Cook' ? '👨‍🍳' : '👕'}
                                    </Text>
                                    <Text style={[
                                        styles.serviceChipText,
                                        isSelected && styles.serviceChipTextSelected,
                                    ]}>
                                        {service}
                                    </Text>
                                    {isSelected && <Text style={styles.checkMark}>✓</Text>}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {selectedServices.length === 0 && (
                        <View style={styles.noServicesBanner}>
                            <Text style={styles.noServicesText}>
                                ⚠️ No services selected. You won't receive any booking requests.
                            </Text>
                        </View>
                    )}
                </View>

                {/* Save / Logout */}
                {editing && (
                    <TouchableOpacity
                        style={[styles.saveButton, saving && styles.disabledButton]}
                        onPress={handleSave}
                        disabled={saving}
                        activeOpacity={0.7}
                    >
                        {saving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        )}
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                    activeOpacity={0.7}
                >
                    <Text style={styles.logoutText}>🚪 Logout</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 48 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: { fontSize: 24, fontWeight: 'bold', color: '#f8fafc' },
    editButton: { fontSize: 14, color: '#10b981', fontWeight: '500' },
    cancelButton: { fontSize: 14, color: '#ef4444', fontWeight: '500' },
    // Avatar section
    avatarSection: { alignItems: 'center', marginBottom: 24 },
    avatar: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    },
    avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
    profileName: { fontSize: 20, fontWeight: 'bold', color: '#f8fafc' },
    profileEmail: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
    verifiedBadge: { marginTop: 8 },
    verifiedText: { fontSize: 13, color: '#6ee7b7', fontWeight: '500' },
    // Stats
    statsRow: {
        flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 14,
        padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#334155',
    },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: 'bold', color: '#f8fafc', marginBottom: 4 },
    statLabel: { fontSize: 12, color: '#94a3b8' },
    divider: { width: 1, backgroundColor: '#334155', marginVertical: 4 },
    // Form
    formSection: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#f8fafc', marginBottom: 4 },
    sectionSubtitle: { fontSize: 13, color: '#94a3b8', marginBottom: 16 },
    fieldGroup: { marginBottom: 16 },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: '#94a3b8', marginBottom: 6 },
    fieldValue: { fontSize: 15, color: '#f8fafc' },
    input: {
        backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155',
        borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#f8fafc',
    },
    textArea: { textAlignVertical: 'top', minHeight: 80 },
    // Services
    servicesGrid: { gap: 10 },
    serviceChip: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#1e293b', borderRadius: 12,
        paddingHorizontal: 16, paddingVertical: 14,
        borderWidth: 1.5, borderColor: '#334155',
    },
    serviceChipSelected: {
        backgroundColor: '#064e3b', borderColor: '#10b981',
    },
    serviceChipDisabled: {
        opacity: 0.85,
    },
    serviceIcon: { fontSize: 20, marginRight: 12 },
    serviceChipText: { fontSize: 15, color: '#94a3b8', flex: 1, fontWeight: '500' },
    serviceChipTextSelected: { color: '#6ee7b7' },
    checkMark: { color: '#10b981', fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
    noServicesBanner: {
        backgroundColor: '#451a03', borderWidth: 1, borderColor: '#78350f',
        borderRadius: 10, padding: 12, marginTop: 12,
    },
    noServicesText: { color: '#fbbf24', fontSize: 13 },
    // Buttons
    saveButton: {
        backgroundColor: '#10b981', borderRadius: 10,
        paddingVertical: 16, alignItems: 'center', marginBottom: 16,
    },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    disabledButton: { opacity: 0.7 },
    logoutButton: {
        borderWidth: 1, borderColor: '#ef4444', borderRadius: 10,
        paddingVertical: 14, alignItems: 'center',
    },
    logoutText: { color: '#ef4444', fontSize: 16, fontWeight: '600' },
});
