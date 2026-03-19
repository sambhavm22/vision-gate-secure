/**
 * Raise Dispute Screen (Worker)
 * Worker can raise a dispute against a booking
 */

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { RootStackParamList } from '../App';
import { useUser } from '../hooks/useUser';
import { supabase } from '../services/supabase';

type Props = NativeStackScreenProps<RootStackParamList, 'RaiseDispute'>;

const ISSUE_TYPES = [
    { key: 'payment', label: 'Payment Issue', icon: '💳' },
    { key: 'no_show', label: 'Customer No-Show', icon: '🚫' },
    { key: 'service_quality', label: 'Unfair Rating', icon: '⭐' },
    { key: 'damage', label: 'Property Damage', icon: '🔨' },
    { key: 'other', label: 'Other', icon: '📝' },
];

export function RaiseDisputeScreen({ route, navigation }: Props): React.JSX.Element {
    const { bookingId, serviceName, customerId } = route.params;
    const { user } = useUser();

    const [issueType, setIssueType] = useState('');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow access to your photo library.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            quality: 0.7,
            selectionLimit: 5 - images.length,
        });
        if (!result.canceled && result.assets) {
            setImages(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, 5));
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const uploadImages = async (): Promise<string[]> => {
        const urls: string[] = [];
        for (const uri of images) {
            try {
                const fileName = `${user?.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
                const response = await fetch(uri);
                const blob = await response.blob();
                const arrayBuffer = await new Response(blob).arrayBuffer();
                const { error } = await supabase.storage
                    .from('dispute-evidence')
                    .upload(fileName, arrayBuffer, { contentType: 'image/jpeg' });
                if (!error) {
                    const { data: urlData } = supabase.storage.from('dispute-evidence').getPublicUrl(fileName);
                    if (urlData?.publicUrl) urls.push(urlData.publicUrl);
                }
            } catch (err) {
                console.error('Image upload error:', err);
            }
        }
        return urls;
    };

    const handleSubmit = async () => {
        if (!issueType) { Alert.alert('Required', 'Please select an issue type.'); return; }
        if (!description.trim()) { Alert.alert('Required', 'Please describe the issue.'); return; }
        if (!user?.id) return;

        setSubmitting(true);
        try {
            const evidenceUrls = images.length > 0 ? await uploadImages() : [];
            const { data, error } = await supabase
                .from('disputes')
                .insert({
                    booking_id: bookingId,
                    user_id: customerId || null,
                    worker_id: user.id,
                    raised_by: user.id,
                    raised_by_role: 'worker',
                    issue_type: issueType,
                    description: description.trim(),
                    evidence_urls: evidenceUrls,
                    status: 'open',
                })
                .select()
                .single();

            if (error) throw error;
            Alert.alert(
                'Dispute Raised ✅',
                'Your issue has been submitted. Our team will review it shortly.',
                [{ text: 'View Details', onPress: () => navigation.replace('DisputeDetail', { disputeId: data.id }) }]
            );
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to submit dispute.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.bookingRef}>
                    <Text style={styles.bookingRefLabel}>Reporting issue for</Text>
                    <Text style={styles.bookingRefValue}>{serviceName} • #{bookingId.slice(0, 8)}</Text>
                </View>

                <Text style={styles.sectionTitle}>What went wrong?</Text>
                <View style={styles.issueGrid}>
                    {ISSUE_TYPES.map(type => (
                        <TouchableOpacity key={type.key} style={[styles.issueChip, issueType === type.key && styles.issueChipSelected]} onPress={() => setIssueType(type.key)} activeOpacity={0.7}>
                            <Text style={styles.issueChipIcon}>{type.icon}</Text>
                            <Text style={[styles.issueChipText, issueType === type.key && styles.issueChipTextSelected]}>{type.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.sectionTitle}>Describe the issue</Text>
                <TextInput style={styles.textArea} value={description} onChangeText={setDescription} placeholder="Tell us what happened in detail..." placeholderTextColor="#64748b" multiline numberOfLines={5} textAlignVertical="top" />

                <Text style={styles.sectionTitle}>Upload Evidence (optional)</Text>
                <Text style={styles.subtitle}>Add up to 5 photos to support your claim</Text>
                <View style={styles.imageRow}>
                    {images.map((uri, index) => (
                        <View key={index} style={styles.imageThumb}>
                            <Image source={{ uri }} style={styles.thumbImage} />
                            <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(index)}><Text style={styles.removeBtnText}>✕</Text></TouchableOpacity>
                        </View>
                    ))}
                    {images.length < 5 && (
                        <TouchableOpacity style={styles.addImageBtn} onPress={pickImage} activeOpacity={0.7}>
                            <Text style={styles.addImageIcon}>📷</Text>
                            <Text style={styles.addImageText}>Add</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity style={[styles.submitBtn, submitting && styles.disabledBtn]} onPress={handleSubmit} disabled={submitting} activeOpacity={0.7}>
                    {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Dispute</Text>}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    scrollContent: { padding: 20, paddingBottom: 48 },
    bookingRef: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#334155', marginBottom: 24 },
    bookingRefLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 4 },
    bookingRefValue: { fontSize: 16, fontWeight: '600', color: '#f8fafc' },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#f8fafc', marginBottom: 12 },
    subtitle: { fontSize: 13, color: '#94a3b8', marginTop: -8, marginBottom: 12 },
    issueGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    issueChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1.5, borderColor: '#334155' },
    issueChipSelected: { backgroundColor: '#14532d', borderColor: '#10b981' },
    issueChipIcon: { fontSize: 18, marginRight: 8 },
    issueChipText: { fontSize: 14, color: '#94a3b8', fontWeight: '500' },
    issueChipTextSelected: { color: '#6ee7b7' },
    textArea: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 12, padding: 16, fontSize: 15, color: '#f8fafc', minHeight: 120, marginBottom: 24 },
    imageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 },
    imageThumb: { width: 80, height: 80, borderRadius: 10, overflow: 'hidden', position: 'relative' },
    thumbImage: { width: '100%', height: '100%' },
    removeBtn: { position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.7)', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
    removeBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    addImageBtn: { width: 80, height: 80, borderRadius: 10, borderWidth: 1.5, borderColor: '#334155', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e293b' },
    addImageIcon: { fontSize: 24, marginBottom: 2 },
    addImageText: { fontSize: 11, color: '#94a3b8' },
    submitBtn: { backgroundColor: '#10b981', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    disabledBtn: { opacity: 0.6 },
});
