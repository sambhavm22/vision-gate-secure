/**
 * Booking Details Screen
 * Shows completed booking details with worker info, schedule, address, payment & support
 */

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { RootStackParamList } from '../App';
import { supabase } from '../services/supabase';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingDetails'>;

export function BookingDetailsScreen({ route, navigation }: Props): React.JSX.Element {
    const {
        bookingId,
        serviceName,
        status,
        scheduledAt,
        durationMinutes,
        totalAmount,
        address,
        workerName,
        paymentMethod,
    } = route.params;

    const [userRating, setUserRating] = useState(0);
    const [currentStatus, setCurrentStatus] = useState(status);
    const [cancelling, setCancelling] = useState(false);

    const isCompleted = currentStatus === 'completed' || currentStatus === 'paid';
    const isCancelled = currentStatus === 'cancelled';
    const isPast = new Date(scheduledAt) < new Date();
    const canCancel = !isCompleted && !isCancelled && !isPast;

    const handleCancelBooking = () => {
        Alert.alert(
            'Cancel Booking',
            'Are you sure you want to cancel this booking? This action cannot be undone.',
            [
                { text: 'Keep Booking', style: 'cancel' },
                {
                    text: 'Cancel Booking',
                    style: 'destructive',
                    onPress: async () => {
                        setCancelling(true);
                        const { error } = await supabase
                            .from('bookings')
                            .update({ status: 'cancelled' })
                            .eq('id', bookingId);

                        setCancelling(false);
                        if (error) {
                            Alert.alert('Error', 'Failed to cancel booking. Please try again.');
                        } else {
                            setCurrentStatus('cancelled');
                            Alert.alert('Booking Cancelled', 'Your booking has been cancelled successfully.', [
                                { text: 'OK', onPress: () => navigation.goBack() },
                            ]);
                        }
                    },
                },
            ]
        );
    };

    // Format date
    const formatDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
            });
        } catch {
            return dateStr;
        }
    };

    // Format time
    const formatTime = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            });
        } catch {
            return '';
        }
    };

    // Format duration
    const formatDuration = (mins: number | null) => {
        if (!mins) return '';
        return `${mins} min visit`;
    };

    // Format payment method
    const formatPaymentMethod = (method: string | null) => {
        if (!method) return 'N/A';
        switch (method.toLowerCase()) {
            case 'upi': return 'UPI';
            case 'card': return 'Credit/Debit Card';
            case 'cash': return 'Cash';
            case 'netbanking': return 'Net Banking';
            default: return method.charAt(0).toUpperCase() + method.slice(1);
        }
    };

    const getStatusLabel = () => {
        switch (currentStatus) {
            case 'completed':
            case 'paid':
                return 'Service Completed';
            case 'in_progress':
                return 'In Progress';
            case 'en_route':
                return 'Expert On The Way';
            case 'accepted':
            case 'matched':
                return 'Expert Assigned';
            case 'requested':
                return 'Booking Requested';
            case 'cancelled':
                return 'Booking Cancelled';
            default:
                return 'Booking Details';
        }
    };

    const getHeaderColor = () => {
        switch (currentStatus) {
            case 'completed':
            case 'paid':
                return '#16a34a';
            case 'cancelled':
                return '#dc2626';
            case 'in_progress':
            case 'en_route':
                return '#2563eb';
            default:
                return '#f59e0b';
        }
    };

    const getHeaderIcon = () => {
        switch (currentStatus) {
            case 'completed':
            case 'paid':
                return '✓';
            case 'cancelled':
                return '✕';
            case 'in_progress':
            case 'en_route':
                return '⟳';
            default:
                return '⏳';
        }
    };

    const handleRating = (star: number) => {
        setUserRating(star);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Green/Colored Header */}
            <View style={[styles.headerSection, { backgroundColor: getHeaderColor() }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>

                {/* Badge */}
                <View style={styles.badgeContainer}>
                    <View style={styles.badgeOuter}>
                        <View style={styles.badgeInner}>
                            <Text style={styles.badgeIcon}>{getHeaderIcon()}</Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.statusLabel}>{getStatusLabel()}</Text>
            </View>

            {/* Details Card */}
            <View style={styles.cardContainer}>
                <View style={styles.dragHandle} />

                <ScrollView
                    contentContainerStyle={styles.cardContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Worker Info */}
                    <View style={styles.workerSection}>
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {(workerName || 'E')[0].toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.avatarBadge}>
                                <Text style={styles.avatarBadgeIcon}>✓</Text>
                            </View>
                        </View>
                        <View style={styles.workerInfo}>
                            <Text style={styles.workerName}>{workerName || 'Expert'}</Text>
                            <View style={styles.ratingRow}>
                                <Text style={styles.ratingLabel}>Your rating: </Text>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <TouchableOpacity
                                        key={star}
                                        onPress={() => handleRating(star)}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            style={[
                                                styles.star,
                                                star <= userRating && styles.starFilled,
                                            ]}
                                        >
                                            ★
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Booking Details */}
                    <View style={styles.detailsSection}>
                        {/* Date & Time */}
                        <View style={styles.detailRow}>
                            <View style={styles.detailIconCircle}>
                                <Text style={styles.detailIconText}>📅</Text>
                            </View>
                            <Text style={styles.detailText}>
                                {formatDate(scheduledAt)}, {formatTime(scheduledAt)}
                                {durationMinutes ? ` • ${formatDuration(durationMinutes)}` : ''}
                            </Text>
                        </View>

                        {/* Address */}
                        {address ? (
                            <View style={[styles.detailRow, { marginTop: 16 }]}>
                                <View style={styles.detailIconCircle}>
                                    <Text style={styles.detailIconText}>📍</Text>
                                </View>
                                <Text style={styles.addressText}>{address}</Text>
                            </View>
                        ) : null}
                    </View>

                    <View style={styles.divider} />

                    {/* Payment & Booking Summary */}
                    <View style={styles.detailsSection}>
                        <Text style={styles.sectionTitle}>Payment & Booking Summary</Text>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Service</Text>
                            <Text style={styles.summaryValue}>{serviceName}</Text>
                        </View>

                        {durationMinutes ? (
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Duration</Text>
                                <Text style={styles.summaryValue}>{formatDuration(durationMinutes)}</Text>
                            </View>
                        ) : null}

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Payment Mode</Text>
                            <Text style={styles.summaryValue}>{formatPaymentMethod(paymentMethod)}</Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Payment Status</Text>
                            <View style={[
                                styles.paymentStatusBadge,
                                { backgroundColor: isCompleted ? '#064e3b' : '#78350f' },
                            ]}>
                                <Text style={[
                                    styles.paymentStatusText,
                                    { color: isCompleted ? '#6ee7b7' : '#fcd34d' },
                                ]}>
                                    {isCompleted ? 'Paid' : 'Pending'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total Amount</Text>
                            <Text style={styles.totalValue}>₹{totalAmount || 0}</Text>
                        </View>
                    </View>

                    <View style={styles.dividerThin} />

                    {/* Reminder Info */}
                    {!isCompleted && !isCancelled && (
                        <View style={[styles.actionRow, { backgroundColor: 'rgba(59, 130, 246, 0.08)', borderRadius: 12, marginBottom: 8 }]}>
                            <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                                <Text style={styles.actionIconText}>⏰</Text>
                            </View>
                            <View style={styles.actionInfo}>
                                <Text style={styles.actionTitle}>Booking Reminder</Text>
                                <Text style={styles.actionSubtitle}>You'll be notified 1 hour before service</Text>
                            </View>
                        </View>
                    )}

                    {/* Track Worker (Only when en_route) */}
                    {status === 'en_route' && (
                        <TouchableOpacity
                            style={[styles.actionRow, { backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: 12, marginBottom: 8 }]}
                            onPress={() => navigation.navigate('LiveTracking', { bookingId })}
                        >
                            <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                                <Text style={styles.actionIconText}>📍</Text>
                            </View>
                            <View style={styles.actionInfo}>
                                <Text style={[styles.actionTitle, { color: '#059669' }]}>Track Worker Live</Text>
                                <Text style={styles.actionSubtitle}>Your expert is on the way</Text>
                            </View>
                            <Text style={[styles.actionChevron, { color: '#059669' }]}>›</Text>
                        </TouchableOpacity>
                    )}

                    {/* Contact Support */}
                    <TouchableOpacity
                        style={styles.actionRow}
                        onPress={() => navigation.navigate('Support')}
                    >
                        <View style={styles.actionIconCircle}>
                            <Text style={styles.actionIconText}>💬</Text>
                        </View>
                        <View style={styles.actionInfo}>
                            <Text style={styles.actionTitle}>Contact Support</Text>
                            <Text style={styles.actionSubtitle}>Get quick help for your queries</Text>
                        </View>
                        <Text style={styles.actionChevron}>›</Text>
                    </TouchableOpacity>

                    <View style={styles.dividerThin} />

                    {/* Report Issue / Raise Dispute */}
                    <TouchableOpacity
                        style={styles.actionRow}
                        onPress={() => navigation.navigate('RaiseDispute', {
                            bookingId,
                            serviceName,
                            workerId: undefined,
                        })}
                    >
                        <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                            <Text style={styles.actionIconText}>⚠️</Text>
                        </View>
                        <View style={styles.actionInfo}>
                            <Text style={styles.actionTitle}>Report Issue</Text>
                            <Text style={styles.actionSubtitle}>Raise a dispute for this booking</Text>
                        </View>
                        <Text style={styles.actionChevron}>›</Text>
                    </TouchableOpacity>

                    {/* Cancel Booking */}
                    {canCancel && (
                        <>
                            <View style={styles.dividerThin} />
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={handleCancelBooking}
                                disabled={cancelling}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.cancelButtonText}>
                                    {cancelling ? 'Cancelling...' : 'Cancel Booking'}
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#16a34a',
    },
    // Header
    headerSection: {
        paddingTop: 8,
        paddingBottom: 40,
        alignItems: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 8,
        left: 16,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    backArrow: {
        fontSize: 24,
        color: '#fff',
        fontWeight: '600',
    },
    badgeContainer: {
        marginTop: 20,
        marginBottom: 16,
    },
    badgeOuter: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeInner: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeIcon: {
        fontSize: 36,
        color: '#fff',
        fontWeight: 'bold',
    },
    statusLabel: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    // Card Container
    cardContainer: {
        flex: 1,
        backgroundColor: '#0f172a',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -16,
        paddingTop: 12,
    },
    dragHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#475569',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    cardContent: {
        padding: 20,
        paddingBottom: 40,
    },
    // Worker Section
    workerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 14,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#334155',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#f8fafc',
    },
    avatarBadge: {
        position: 'absolute',
        bottom: -2,
        left: -2,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#0f172a',
    },
    avatarBadgeIcon: {
        fontSize: 10,
        color: '#fff',
        fontWeight: 'bold',
    },
    workerInfo: {
        flex: 1,
    },
    workerName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#f8fafc',
        marginBottom: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingLabel: {
        fontSize: 14,
        color: '#94a3b8',
        marginRight: 4,
    },
    star: {
        fontSize: 20,
        color: '#475569',
        marginRight: 2,
    },
    starFilled: {
        color: '#f59e0b',
    },
    // Dividers
    divider: {
        height: 1,
        backgroundColor: '#1e293b',
        marginVertical: 16,
    },
    dividerThin: {
        height: 1,
        backgroundColor: '#1e293b',
        marginVertical: 4,
    },
    // Details Section
    detailsSection: {
        backgroundColor: '#1e293b',
        borderRadius: 14,
        padding: 16,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    detailIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(236, 72, 153, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    detailIconText: {
        fontSize: 16,
    },
    detailText: {
        fontSize: 15,
        color: '#f8fafc',
        flex: 1,
        lineHeight: 22,
        marginTop: 6,
    },
    addressText: {
        fontSize: 14,
        color: '#94a3b8',
        flex: 1,
        lineHeight: 22,
        marginTop: 4,
    },
    // Action Rows
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
    },
    actionIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(236, 72, 153, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    actionIconText: {
        fontSize: 18,
        color: '#ec4899',
        fontWeight: 'bold',
    },
    actionInfo: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#f8fafc',
        marginBottom: 2,
    },
    actionSubtitle: {
        fontSize: 13,
        color: '#94a3b8',
    },
    actionChevron: {
        fontSize: 24,
        color: '#64748b',
        fontWeight: 'bold',
    },
    // Payment Summary
    sectionTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#f8fafc',
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    summaryLabel: {
        fontSize: 14,
        color: '#94a3b8',
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#f8fafc',
    },
    paymentStatusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    paymentStatusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 14,
        marginTop: 4,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#f8fafc',
    },
    totalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#10b981',
    },
    cancelButton: {
        backgroundColor: '#dc2626',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
