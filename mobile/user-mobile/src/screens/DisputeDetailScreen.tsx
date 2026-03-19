/**
 * Dispute Detail Screen
 * Shows dispute info, evidence, resolution, and real-time chat
 */

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
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

type Props = NativeStackScreenProps<RootStackParamList, 'DisputeDetail'>;

interface Dispute {
    id: string;
    booking_id: string;
    user_id: string;
    worker_id: string | null;
    raised_by: string;
    raised_by_role: string;
    issue_type: string;
    description: string;
    evidence_urls: string[];
    status: string;
    resolution_note: string | null;
    created_at: string;
    updated_at: string;
}

interface Message {
    id: string;
    dispute_id: string;
    sender_id: string;
    sender_role: string;
    message: string;
    attachments: string[];
    created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
    open: { label: 'Open', bg: '#78350f', color: '#fcd34d' },
    in_review: { label: 'In Review', bg: '#1e3a5f', color: '#7dd3fc' },
    resolved: { label: 'Resolved', bg: '#064e3b', color: '#6ee7b7' },
    rejected: { label: 'Rejected', bg: '#7f1d1d', color: '#fca5a5' },
};

export function DisputeDetailScreen({ route, navigation }: Props): React.JSX.Element {
    const { disputeId } = route.params;
    const { user } = useUser();

    const [dispute, setDispute] = useState<Dispute | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const flatListRef = useRef<FlatList>(null);

    const fetchDispute = useCallback(async () => {
        const { data, error } = await supabase
            .from('disputes')
            .select('*')
            .eq('id', disputeId)
            .single();
        if (!error && data) setDispute(data);
    }, [disputeId]);

    const fetchMessages = useCallback(async () => {
        const { data, error } = await supabase
            .from('support_messages')
            .select('*')
            .eq('dispute_id', disputeId)
            .order('created_at', { ascending: true });
        if (!error) setMessages(data || []);
    }, [disputeId]);

    useEffect(() => {
        Promise.all([fetchDispute(), fetchMessages()]).finally(() => setLoading(false));
    }, [fetchDispute, fetchMessages]);

    // Real-time subscription for new messages
    useEffect(() => {
        const channel = supabase
            .channel(`dispute-chat-${disputeId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `dispute_id=eq.${disputeId}` },
                (payload) => {
                    const newMsg = payload.new as Message;
                    setMessages(prev => {
                        if (prev.find(m => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });
                    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
                }
            )
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [disputeId]);

    // Real-time subscription for dispute status changes
    useEffect(() => {
        const channel = supabase
            .channel(`dispute-status-${disputeId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'disputes', filter: `id=eq.${disputeId}` },
                () => fetchDispute()
            )
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [disputeId, fetchDispute]);

    const handleSend = async () => {
        const text = newMessage.trim();
        if (!text || !user?.id || !dispute) return;

        setSending(true);
        setNewMessage('');
        try {
            const { error } = await supabase
                .from('support_messages')
                .insert({
                    dispute_id: dispute.id,
                    sender_id: user.id,
                    sender_role: 'user',
                    message: text,
                    attachments: [],
                });
            if (error) throw error;
        } catch (err) {
            setNewMessage(text);
            console.error('Send message error:', err);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleTimeString('en-IN', {
                hour: '2-digit', minute: '2-digit', hour12: true,
            });
        } catch {
            return '';
        }
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

    const renderMessage = ({ item }: { item: Message }) => {
        const isMe = item.sender_id === user?.id;
        const isAdmin = item.sender_role === 'admin';

        return (
            <View style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}>
                {!isMe && (
                    <View style={[styles.senderDot, isAdmin ? styles.senderDotAdmin : styles.senderDotOther]} />
                )}
                <View style={[
                    styles.msgBubble,
                    isMe ? styles.msgBubbleMine : (isAdmin ? styles.msgBubbleAdmin : styles.msgBubbleOther),
                ]}>
                    {!isMe && (
                        <Text style={styles.senderLabel}>
                            {isAdmin ? '🛡️ Admin' : '👷 Worker'}
                        </Text>
                    )}
                    <Text style={styles.msgText}>{item.message}</Text>
                    <Text style={styles.msgTime}>{formatTime(item.created_at)}</Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6366f1" />
                </View>
            </SafeAreaView>
        );
    }

    if (!dispute) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={{ color: '#94a3b8', fontSize: 16 }}>Dispute not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    const statusCfg = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.open;

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                {/* Header Info - Scrollable */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={item => item.id}
                    renderItem={renderMessage}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    contentContainerStyle={styles.chatContent}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <View>
                            {/* Status & Issue */}
                            <View style={styles.infoCard}>
                                <View style={styles.infoRow}>
                                    <Text style={styles.issueType}>
                                        {dispute.issue_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                    </Text>
                                    <View style={[styles.badge, { backgroundColor: statusCfg.bg }]}>
                                        <Text style={[styles.badgeText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
                                    </View>
                                </View>
                                <Text style={styles.descriptionText}>{dispute.description}</Text>
                                <Text style={styles.dateText}>Raised on {formatDate(dispute.created_at)}</Text>
                            </View>

                            {/* Evidence */}
                            {dispute.evidence_urls.length > 0 && (
                                <View style={styles.evidenceSection}>
                                    <Text style={styles.sectionLabel}>Evidence</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        {dispute.evidence_urls.map((url, i) => (
                                            <Image key={i} source={{ uri: url }} style={styles.evidenceImage} />
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            {/* Resolution Note */}
                            {dispute.resolution_note && (
                                <View style={styles.resolutionCard}>
                                    <Text style={styles.resolutionTitle}>🛡️ Admin Resolution</Text>
                                    <Text style={styles.resolutionText}>{dispute.resolution_note}</Text>
                                </View>
                            )}

                            {/* Chat header */}
                            <View style={styles.chatDivider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>Messages</Text>
                                <View style={styles.dividerLine} />
                            </View>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.noMessages}>
                            <Text style={styles.noMessagesText}>No messages yet. Start the conversation!</Text>
                        </View>
                    }
                />

                {/* Chat Input */}
                {(dispute.status === 'open' || dispute.status === 'in_review') && (
                    <View style={styles.inputBar}>
                        <TextInput
                            style={styles.msgInput}
                            value={newMessage}
                            onChangeText={setNewMessage}
                            placeholder="Type a message..."
                            placeholderTextColor="#64748b"
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity
                            style={[styles.sendBtn, (!newMessage.trim() || sending) && styles.sendBtnDisabled]}
                            onPress={handleSend}
                            disabled={!newMessage.trim() || sending}
                        >
                            <Text style={styles.sendBtnText}>
                                {sending ? '...' : '↑'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    chatContent: { padding: 16, paddingBottom: 8 },
    infoCard: {
        backgroundColor: '#1e293b', borderRadius: 14, padding: 16,
        borderWidth: 1, borderColor: '#334155', marginBottom: 12,
    },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    issueType: { fontSize: 17, fontWeight: '700', color: '#f8fafc' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    descriptionText: { fontSize: 14, color: '#cbd5e1', lineHeight: 20, marginBottom: 8 },
    dateText: { fontSize: 12, color: '#64748b' },
    evidenceSection: { marginBottom: 12 },
    sectionLabel: { fontSize: 13, fontWeight: '600', color: '#94a3b8', marginBottom: 8 },
    evidenceImage: { width: 100, height: 100, borderRadius: 10, marginRight: 10 },
    resolutionCard: {
        backgroundColor: '#1a2e1a', borderRadius: 12, padding: 14,
        borderWidth: 1, borderColor: '#22c55e33', marginBottom: 12,
    },
    resolutionTitle: { fontSize: 13, fontWeight: '700', color: '#6ee7b7', marginBottom: 6 },
    resolutionText: { fontSize: 14, color: '#bbf7d0', lineHeight: 20 },
    chatDivider: {
        flexDirection: 'row', alignItems: 'center', marginVertical: 16,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#334155' },
    dividerText: { marginHorizontal: 12, fontSize: 12, color: '#64748b', fontWeight: '600' },
    noMessages: { alignItems: 'center', paddingVertical: 24 },
    noMessagesText: { fontSize: 13, color: '#64748b' },
    // Chat messages
    msgRow: { marginBottom: 8 },
    msgRowRight: { alignItems: 'flex-end' },
    msgRowLeft: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
    senderDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
    senderDotAdmin: { backgroundColor: '#6366f1' },
    senderDotOther: { backgroundColor: '#f59e0b' },
    msgBubble: { maxWidth: '78%', borderRadius: 16, padding: 12, paddingBottom: 6 },
    msgBubbleMine: { backgroundColor: '#312e81', borderBottomRightRadius: 4 },
    msgBubbleAdmin: { backgroundColor: '#1e293b', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#6366f133' },
    msgBubbleOther: { backgroundColor: '#1e293b', borderBottomLeftRadius: 4 },
    senderLabel: { fontSize: 11, fontWeight: '700', color: '#a5b4fc', marginBottom: 4 },
    msgText: { fontSize: 14, color: '#f8fafc', lineHeight: 20 },
    msgTime: { fontSize: 10, color: '#64748b', marginTop: 4, textAlign: 'right' },
    // Input bar
    inputBar: {
        flexDirection: 'row', alignItems: 'flex-end', padding: 12,
        borderTopWidth: 1, borderTopColor: '#1e293b', backgroundColor: '#0f172a',
    },
    msgInput: {
        flex: 1, backgroundColor: '#1e293b', borderRadius: 20,
        paddingHorizontal: 16, paddingVertical: 10, fontSize: 15,
        color: '#f8fafc', maxHeight: 100, marginRight: 8,
    },
    sendBtn: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#6366f1',
        justifyContent: 'center', alignItems: 'center',
    },
    sendBtnDisabled: { opacity: 0.4 },
    sendBtnText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
});
