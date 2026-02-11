/**
 * Schedule Screen
 * Custom screen for scheduling a service (Pre-book)
 */

import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';
import { RootStackParamList } from '../App';

type ScheduleScreenRouteProp = RouteProp<RootStackParamList, 'Schedule'>;

export function ScheduleScreen(): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<ScheduleScreenRouteProp>();
    const { serviceId, serviceName } = route.params;

    const [scheduleTab, setScheduleTab] = useState<'single' | 'subscription'>('single');
    const [selectedDate, setSelectedDate] = useState<number | null>(11); // Defaulting to 11th for demo as per image
    const [selectedTime, setSelectedTime] = useState<string>('10:00');
    const [scheduledDuration, setScheduledDuration] = useState(2);

    // Subscription State
    const [subType, setSubType] = useState<'daily' | 'alternate'>('daily');
    const [isIndefinite, setIsIndefinite] = useState(false);

    // Simple calendar data generation (Feb 2026 as per image)
    // Starting Feb 1st 2026 is a Sunday
    const CALENDAR_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);
    const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    const TIME_SLOTS = [
        '09:00', '10:00', '11:00',
        '12:00', '13:00', '14:00',
        '15:00', '16:00', '17:00'
    ];

    // Simple calendar data generation (Feb 2026 as per image)
    const handleScheduleConfirm = () => {
        // Just reusing the booking navigation for now
        navigation.navigate('Booking', {
            serviceId,
            serviceName,
            bookingType: 'prebook',
            duration: scheduledDuration,
            date: scheduleTab === 'single' ? `2026-02-${selectedDate}` : `Starting 11/02/2026 (${subType})`,
            time: selectedTime, // Simplified for now
            price: 400
        });
    };

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={[styles.backText, isDarkMode && styles.darkText]}>←</Text>
                    </TouchableOpacity>
                    <Text style={[styles.title, isDarkMode && styles.darkText]}>Schedule Service</Text>
                    <View style={{ width: 40 }} />
                </View>
                <Text style={{ textAlign: 'center', color: isDarkMode ? '#94a3b8' : '#64748b', marginBottom: 20 }}>
                    {serviceName}
                </Text>

                {/* Tabs */}
                <View style={[styles.tabContainer, isDarkMode && styles.darkTabContainer]}>
                    <TouchableOpacity
                        style={[styles.tab, scheduleTab === 'single' && styles.activeTab]}
                        onPress={() => setScheduleTab('single')}
                    >
                        <Text style={[styles.tabText, scheduleTab === 'single' ? styles.activeTabText : styles.inactiveTabText]}>Single Service</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, scheduleTab === 'subscription' && styles.activeTab]}
                        onPress={() => setScheduleTab('subscription')}
                    >
                        <Text style={[styles.tabText, scheduleTab === 'subscription' ? styles.activeTabText : styles.inactiveTabText]}>Subscription</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    {scheduleTab === 'single' ? (
                        <View style={styles.row}>
                            {/* Calendar Section */}
                            <View style={[styles.card, isDarkMode && styles.darkCard, { flex: 1, marginRight: 12 }]}>
                                <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Select Date</Text>

                                {/* Month Nav */}
                                <View style={styles.monthNav}>
                                    <TouchableOpacity style={styles.navArrow}><Text style={styles.navArrowText}>{'<'}</Text></TouchableOpacity>
                                    <Text style={[styles.monthText, isDarkMode && styles.darkText]}>February 2026</Text>
                                    <TouchableOpacity style={styles.navArrow}><Text style={styles.navArrowText}>{'>'}</Text></TouchableOpacity>
                                </View>

                                {/* Days Header */}
                                <View style={styles.daysHeader}>
                                    {WEEKDAYS.map(day => (
                                        <Text key={day} style={styles.dayHeaderText}>{day}</Text>
                                    ))}
                                </View>

                                {/* Days Grid */}
                                <View style={styles.daysGrid}>
                                    {CALENDAR_DAYS.map(day => (
                                        <TouchableOpacity
                                            key={day}
                                            style={[
                                                styles.dayCell,
                                                selectedDate === day && styles.selectedDayCell
                                            ]}
                                            onPress={() => setSelectedDate(day)}
                                        >
                                            <Text style={[
                                                styles.dayText,
                                                isDarkMode && styles.darkTextMuted,
                                                selectedDate === day && styles.selectedDayText
                                            ]}>{day}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Time & Duration Section */}
                            <View style={{ flex: 1 }}>
                                {/* Time Slots */}
                                <View style={{ marginBottom: 24 }}>
                                    <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Select Time</Text>
                                    <View style={styles.timeGrid}>
                                        {TIME_SLOTS.map(time => (
                                            <TouchableOpacity
                                                key={time}
                                                style={[
                                                    styles.timeSlot,
                                                    isDarkMode && styles.darkTimeSlot,
                                                    selectedTime === time && styles.selectedTimeSlot
                                                ]}
                                                onPress={() => setSelectedTime(time)}
                                            >
                                                <Text style={[
                                                    styles.timeText,
                                                    isDarkMode && styles.darkText,
                                                    selectedTime === time && styles.selectedTimeText
                                                ]}>{time}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Duration Stepper */}
                                <View>
                                    <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Duration (Hours)</Text>
                                    <View style={styles.durationControl}>
                                        <TouchableOpacity
                                            style={[styles.stepperReadout, isDarkMode && styles.darkStepper]}
                                            onPress={() => setScheduledDuration(Math.max(1, scheduledDuration - 0.5))}
                                        >
                                            <Text style={styles.stepperText}>-</Text>
                                        </TouchableOpacity>
                                        <Text style={[styles.durationValue, isDarkMode && styles.darkText]}>{scheduledDuration}</Text>
                                        <TouchableOpacity
                                            style={[styles.stepperReadout, isDarkMode && styles.darkStepper]}
                                            onPress={() => setScheduledDuration(scheduledDuration + 0.5)}
                                        >
                                            <Text style={styles.stepperText}>+</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.subscriptionContainer}>
                            {/* Subscription Type */}
                            <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Subscription Type</Text>
                            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                                <TouchableOpacity
                                    style={[styles.subTypeBtn, subType === 'daily' && styles.subTypeBtnActive]}
                                    onPress={() => setSubType('daily')}
                                >
                                    <Text style={[styles.subTypeText, subType === 'daily' && styles.subTypeTextActive]}>Daily</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.subTypeBtn, subType === 'alternate' && styles.subTypeBtnActive]}
                                    onPress={() => setSubType('alternate')}
                                >
                                    <Text style={[styles.subTypeText, subType === 'alternate' && styles.subTypeTextActive]}>Alternate Days</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Dates */}
                            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.inputLabel, isDarkMode && styles.darkTextMuted]}>Start Date</Text>
                                    <View style={[styles.inputField, isDarkMode && styles.darkInputField]}>
                                        <Text style={[styles.inputText, isDarkMode && styles.darkText]}>11/02/2026</Text>
                                        <Text>📅</Text>
                                    </View>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <Text style={[styles.inputLabel, isDarkMode && styles.darkTextMuted, { marginBottom: 0 }]}>End Date</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                            <TouchableOpacity
                                                onPress={() => setIsIndefinite(!isIndefinite)}
                                                style={[styles.checkbox, isIndefinite && styles.checkboxActive]}
                                            >
                                                {isIndefinite && <Text style={{ color: '#0f172a', fontSize: 10, fontWeight: 'bold' }}>✓</Text>}
                                            </TouchableOpacity>
                                            <Text style={{ fontSize: 10, color: isDarkMode ? '#94a3b8' : '#64748b' }}>As long as I wish</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.inputField, isDarkMode && styles.darkInputField, isIndefinite && { opacity: 0.5 }]}>
                                        <Text style={[styles.inputText, isDarkMode && styles.darkText]}>{isIndefinite ? ' - ' : 'dd/mm/yyyy'}</Text>
                                        <Text>📅</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Preferred Time */}
                            <Text style={[styles.inputLabel, isDarkMode && styles.darkTextMuted]}>Preferred Time</Text>
                            <View style={[styles.inputField, isDarkMode && styles.darkInputField, { marginBottom: 24 }]}>
                                <Text style={[styles.inputText, isDarkMode && styles.darkText]}>10:00 AM</Text>
                                <Text>🕒</Text>
                            </View>

                            {/* Duration */}
                            <Text style={[styles.inputLabel, isDarkMode && styles.darkTextMuted]}>Duration (Hours)</Text>
                            <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                                <TouchableOpacity
                                    style={[styles.stepperReadout, isDarkMode && styles.darkStepper]}
                                    onPress={() => setScheduledDuration(Math.max(1, scheduledDuration - 0.5))}
                                >
                                    <Text style={styles.stepperText}>-</Text>
                                </TouchableOpacity>
                                <Text style={[styles.durationValue, isDarkMode && styles.darkText]}>{scheduledDuration}</Text>
                                <TouchableOpacity
                                    style={[styles.stepperReadout, isDarkMode && styles.darkStepper]}
                                    onPress={() => setScheduledDuration(scheduledDuration + 0.5)}
                                >
                                    <Text style={styles.stepperText}>+</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* Summary Footer */}
                <View style={styles.footer}>
                    <View style={[styles.summaryContainer, isDarkMode && styles.darkSummaryContainer]}>
                        <View style={styles.summaryItem}>
                            <View style={styles.summaryIcon}>
                                <Text style={{ fontSize: 20 }}>📅</Text>
                            </View>
                            <View>
                                <Text style={styles.summaryLabel}>
                                    {scheduleTab === 'single' ? 'Selected Schedule' : 'Selected Subscription'}
                                </Text>
                                <Text style={[styles.summaryValue, isDarkMode && styles.darkSummaryText]}>
                                    {scheduleTab === 'single'
                                        ? `Wed, ${selectedDate} Feb at ${selectedTime}`
                                        : `Select Type from 11 Feb 2026 at 10:00`
                                    }
                                </Text>
                            </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.summaryLabel}>Duration</Text>
                            <Text style={[styles.summaryValue, isDarkMode && styles.darkSummaryText]}>{scheduledDuration} Hrs</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.proceedButton, scheduleTab === 'subscription' && styles.subscribeButton]}
                        onPress={handleScheduleConfirm}
                    >
                        <Text style={styles.proceedButtonText}>
                            {scheduleTab === 'single' ? 'Proceed with Schedule' : 'Configure Subscription'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    darkContainer: {
        backgroundColor: '#0f172a',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    backText: {
        fontSize: 24,
        color: '#0f172a',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    darkText: {
        color: '#f8fafc',
    },
    darkTextMuted: {
        color: '#94a3b8',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: 8,
        padding: 4,
        marginBottom: 24,
    },
    darkTabContainer: {
        backgroundColor: '#1e293b',
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 6,
        alignItems: 'center',
    },
    activeTab: {
        backgroundColor: '#ffffff',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    // Dark mode active tab handled implicitly or needs explicit style if bg is different
    // Assuming simple white bg for active tab in light mode. 
    // For dark mode, active tab should probably be darker. Using logic below.

    activeTabText: {
        color: '#0f172a',
        fontWeight: '600',
    },
    inactiveTabText: {
        color: '#94a3b8',
        fontWeight: '600',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
    },
    row: {
        flexDirection: 'column', // Changed to column for mobile full width stacking or row depending on layout preference. User asked for full screen, probably portrait.
        gap: 24,
    },
    card: {
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        padding: 16,
    },
    darkCard: {
        backgroundColor: '#1e293b',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 16,
    },
    monthNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    navArrow: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#334155',
        alignItems: 'center',
        justifyContent: 'center',
    },
    navArrowText: {
        color: '#94a3b8',
    },
    monthText: {
        fontWeight: '600',
        color: '#0f172a',
    },
    daysHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    dayHeaderText: {
        color: '#94a3b8',
        fontSize: 12,
        width: 30, // Fixed width for alignment
        textAlign: 'center',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 12,
    },
    dayCell: {
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 4,
    },
    selectedDayCell: {
        backgroundColor: '#10b981',
    },
    dayText: {
        color: '#334155',
        fontSize: 12,
    },
    selectedDayText: {
        color: 'white',
    },
    timeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    timeSlot: {
        backgroundColor: '#e2e8f0',
        borderRadius: 8,
        paddingVertical: 8,
        width: '30%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    darkTimeSlot: {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
    },
    selectedTimeSlot: {
        backgroundColor: '#db2777',
        borderColor: '#db2777',
    },
    timeText: {
        color: '#0f172a',
        fontSize: 12,
        fontWeight: '600',
    },
    selectedTimeText: {
        color: 'white',
    },
    durationControl: {
        flexDirection: 'row',
        gap: 16,
        alignItems: 'center',
    },
    stepperReadout: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    darkStepper: {
        backgroundColor: '#1e293b',
    },
    stepperText: {
        color: '#64748b', // '#cbd5e1' for dark
        fontSize: 20,
    },
    durationValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    footer: {
        marginTop: 20,
    },
    summaryContainer: {
        backgroundColor: '#fce7f3',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    summaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    summaryIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fbcfe8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryLabel: {
        color: '#9ca3af',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    summaryValue: {
        color: '#1f2937',
        fontSize: 16,
        fontWeight: 'bold',
    },
    proceedButton: {
        backgroundColor: '#10b981', // or match your theme (maybe needs to be darker/prominent)
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    proceedButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Subscription Styles
    subscriptionContainer: {
        paddingTop: 8,
    },
    subTypeRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    subTypeBtn: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#334155',
        alignItems: 'center',
    },
    subTypeBtnActive: {
        borderColor: '#3b82f6', // or theme color, using nice blue
        backgroundColor: '#1e293b',
    },
    subTypeText: {
        color: '#94a3b8',
        fontWeight: '600',
    },
    subTypeTextActive: {
        color: 'white',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: 8,
    },
    inputField: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    darkInputField: {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
    },
    inputText: {
        color: '#0f172a',
        fontWeight: '600',
    },
    checkbox: {
        width: 16,
        height: 16,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#94a3b8',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 6,
        backgroundColor: 'white',
    },
    checkboxActive: {
        backgroundColor: 'white',
        borderColor: 'white',
    },
    checkboxLabel: {
        fontSize: 10,
    },
    darkSummaryContainer: {
        backgroundColor: '#1e293b',
        borderWidth: 1,
        borderColor: '#334155',
    },
    darkSummaryText: {
        color: 'white',
    },
    subscribeButton: {
        backgroundColor: '#10b981', // Green as per image
    },
});
