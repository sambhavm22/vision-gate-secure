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

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed
    const currentDay = now.getDate();
    const currentHour = now.getHours();

    const [scheduleTab, setScheduleTab] = useState<'single' | 'subscription'>('single');
    const [viewMonth, setViewMonth] = useState(currentMonth); // 0-indexed
    const [viewYear, setViewYear] = useState(currentYear);
    const [selectedDate, setSelectedDate] = useState<number>(currentDay);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [scheduledDuration, setScheduledDuration] = useState(2);

    // Subscription State
    const [subType, setSubType] = useState<'daily' | 'alternate'>('daily');
    const [isIndefinite, setIsIndefinite] = useState(false);
    const [subViewMonth, setSubViewMonth] = useState(currentMonth);
    const [subViewYear, setSubViewYear] = useState(currentYear);
    const [subSelectedDate, setSubSelectedDate] = useState(currentDay);
    const [showSubDatePicker, setShowSubDatePicker] = useState(false);
    const [showSubTimePicker, setShowSubTimePicker] = useState(false);

    const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    const TIME_SLOTS = [
        '09:00', '10:00', '11:00',
        '12:00', '13:00', '14:00',
        '15:00', '16:00', '17:00'
    ];

    // Dynamic calendar helpers
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDayOfWeek = getFirstDayOfMonth(viewYear, viewMonth);
    const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const MONTH_NAMES = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Check if a day is in the past
    const isDayPast = (day: number) => {
        if (viewYear < currentYear) return true;
        if (viewYear === currentYear && viewMonth < currentMonth) return true;
        if (viewYear === currentYear && viewMonth === currentMonth && day < currentDay) return true;
        return false;
    };

    // Check if the selected date is today
    const isToday = viewYear === currentYear && viewMonth === currentMonth && selectedDate === currentDay;

    // Check if a time slot is past (only relevant if today is selected)
    const isTimePast = (timeStr: string) => {
        if (!isToday) return false;
        const hour = parseInt(timeStr.split(':')[0], 10);
        return hour <= currentHour;
    };

    // Can go to previous month?
    const canGoPrev = viewYear > currentYear || (viewYear === currentYear && viewMonth > currentMonth);

    const handlePrevMonth = () => {
        if (!canGoPrev) return;
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear(viewYear - 1);
        } else {
            setViewMonth(viewMonth - 1);
        }
        setSelectedDate(1);
        setSelectedTime(null);
    };

    const handleNextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear(viewYear + 1);
        } else {
            setViewMonth(viewMonth + 1);
        }
        setSelectedDate(1);
        setSelectedTime(null);
    };

    const handleDayPress = (day: number) => {
        if (isDayPast(day)) return;
        setSelectedDate(day);
        // Reset time if it would be in the past on the newly selected date
        if (selectedTime && viewYear === currentYear && viewMonth === currentMonth && day === currentDay) {
            const hour = parseInt(selectedTime.split(':')[0], 10);
            if (hour <= currentHour) {
                setSelectedTime(null);
            }
        }
    };

    // Format date as YYYY-MM-DD
    const formatDateISO = (day: number) => {
        const m = String(viewMonth + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${viewYear}-${m}-${d}`;
    };

    const handleScheduleConfirm = () => {
        if (!selectedTime) {
            // Auto-select first available time
            const firstAvailable = TIME_SLOTS.find(t => !isTimePast(t));
            if (!firstAvailable) return;
            setSelectedTime(firstAvailable);
        }

        const timeToUse = selectedTime || TIME_SLOTS.find(t => !isTimePast(t)) || '09:00';

        navigation.navigate('Booking', {
            serviceId,
            serviceName,
            bookingType: 'prebook',
            duration: scheduledDuration,
            date: scheduleTab === 'single'
                ? formatDateISO(selectedDate)
                : `Starting ${subViewYear}-${String(subViewMonth + 1).padStart(2, '0')}-${String(subSelectedDate).padStart(2, '0')} (${subType})`,
            time: timeToUse,
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
                                    <TouchableOpacity
                                        style={[styles.navArrow, !canGoPrev && { opacity: 0.3 }]}
                                        onPress={handlePrevMonth}
                                        disabled={!canGoPrev}
                                    >
                                        <Text style={styles.navArrowText}>{'<'}</Text>
                                    </TouchableOpacity>
                                    <Text style={[styles.monthText, isDarkMode && styles.darkText]}>
                                        {MONTH_NAMES[viewMonth]} {viewYear}
                                    </Text>
                                    <TouchableOpacity style={styles.navArrow} onPress={handleNextMonth}>
                                        <Text style={styles.navArrowText}>{'>'}</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Days Header */}
                                <View style={styles.daysHeader}>
                                    {WEEKDAYS.map(day => (
                                        <Text key={day} style={styles.dayHeaderText}>{day}</Text>
                                    ))}
                                </View>

                                {/* Days Grid */}
                                <View style={styles.daysGrid}>
                                    {/* Blank spacers for proper alignment */}
                                    {Array.from({ length: firstDayOfWeek }, (_, i) => (
                                        <View key={`blank-${i}`} style={styles.dayCell} />
                                    ))}
                                    {calendarDays.map(day => {
                                        const past = isDayPast(day);
                                        return (
                                            <TouchableOpacity
                                                key={day}
                                                style={[
                                                    styles.dayCell,
                                                    selectedDate === day && !past && styles.selectedDayCell,
                                                    past && { opacity: 0.3 },
                                                ]}
                                                onPress={() => handleDayPress(day)}
                                                disabled={past}
                                            >
                                                <Text style={[
                                                    styles.dayText,
                                                    isDarkMode && styles.darkTextMuted,
                                                    selectedDate === day && !past && styles.selectedDayText,
                                                ]}>{day}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Time & Duration Section */}
                            <View style={{ flex: 1 }}>
                                {/* Time Slots */}
                                <View style={{ marginBottom: 24 }}>
                                    <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Select Time</Text>
                                    <View style={styles.timeGrid}>
                                        {TIME_SLOTS.map(time => {
                                            const past = isTimePast(time);
                                            return (
                                                <TouchableOpacity
                                                    key={time}
                                                    style={[
                                                        styles.timeSlot,
                                                        isDarkMode && styles.darkTimeSlot,
                                                        selectedTime === time && !past && styles.selectedTimeSlot,
                                                        past && { opacity: 0.3 },
                                                    ]}
                                                    onPress={() => !past && setSelectedTime(time)}
                                                    disabled={past}
                                                >
                                                    <Text style={[
                                                        styles.timeText,
                                                        isDarkMode && styles.darkText,
                                                        selectedTime === time && !past && styles.selectedTimeText,
                                                    ]}>{time}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
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
                            <View style={{ marginBottom: 24 }}>
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.inputLabel, isDarkMode && styles.darkTextMuted]}>Start Date</Text>
                                        <TouchableOpacity
                                            style={[styles.inputField, isDarkMode && styles.darkInputField]}
                                            onPress={() => setShowSubDatePicker(!showSubDatePicker)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={[styles.inputText, isDarkMode && styles.darkText]}>
                                                {String(subSelectedDate).padStart(2, '0')}/{String(subViewMonth + 1).padStart(2, '0')}/{subViewYear}
                                            </Text>
                                            <Text>📅</Text>
                                        </TouchableOpacity>
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

                                {/* Inline Date Picker */}
                                {showSubDatePicker && (
                                    <View style={[styles.card, isDarkMode && styles.darkCard, { marginTop: 12 }]}>
                                        <View style={styles.monthNav}>
                                            <TouchableOpacity
                                                style={[styles.navArrow, !(subViewYear > currentYear || (subViewYear === currentYear && subViewMonth > currentMonth)) && { opacity: 0.3 }]}
                                                onPress={() => {
                                                    if (subViewYear > currentYear || (subViewYear === currentYear && subViewMonth > currentMonth)) {
                                                        if (subViewMonth === 0) { setSubViewMonth(11); setSubViewYear(subViewYear - 1); }
                                                        else { setSubViewMonth(subViewMonth - 1); }
                                                    }
                                                }}
                                                disabled={!(subViewYear > currentYear || (subViewYear === currentYear && subViewMonth > currentMonth))}
                                            >
                                                <Text style={styles.navArrowText}>{'<'}</Text>
                                            </TouchableOpacity>
                                            <Text style={[styles.monthText, isDarkMode && styles.darkText]}>
                                                {MONTH_NAMES[subViewMonth]} {subViewYear}
                                            </Text>
                                            <TouchableOpacity
                                                style={styles.navArrow}
                                                onPress={() => {
                                                    if (subViewMonth === 11) { setSubViewMonth(0); setSubViewYear(subViewYear + 1); }
                                                    else { setSubViewMonth(subViewMonth + 1); }
                                                }}
                                            >
                                                <Text style={styles.navArrowText}>{'>'}</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <View style={styles.daysHeader}>
                                            {WEEKDAYS.map(d => (
                                                <Text key={d} style={styles.dayHeaderText}>{d}</Text>
                                            ))}
                                        </View>
                                        <View style={styles.daysGrid}>
                                            {Array.from({ length: getFirstDayOfMonth(subViewYear, subViewMonth) }, (_, i) => (
                                                <View key={`sb-${i}`} style={styles.dayCell} />
                                            ))}
                                            {Array.from({ length: getDaysInMonth(subViewYear, subViewMonth) }, (_, i) => i + 1).map(day => {
                                                const past = (subViewYear < currentYear) ||
                                                    (subViewYear === currentYear && subViewMonth < currentMonth) ||
                                                    (subViewYear === currentYear && subViewMonth === currentMonth && day < currentDay);
                                                return (
                                                    <TouchableOpacity
                                                        key={day}
                                                        style={[
                                                            styles.dayCell,
                                                            subSelectedDate === day && subViewMonth === subViewMonth && !past && styles.selectedDayCell,
                                                            past && { opacity: 0.3 },
                                                        ]}
                                                        onPress={() => { if (!past) { setSubSelectedDate(day); setShowSubDatePicker(false); } }}
                                                        disabled={!!past}
                                                    >
                                                        <Text style={[
                                                            styles.dayText,
                                                            isDarkMode && styles.darkTextMuted,
                                                            subSelectedDate === day && !past && styles.selectedDayText,
                                                        ]}>{day}</Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </View>
                                )}
                            </View>

                            {/* Preferred Time */}
                            <Text style={[styles.inputLabel, isDarkMode && styles.darkTextMuted]}>Preferred Time</Text>
                            <TouchableOpacity
                                style={[styles.inputField, isDarkMode && styles.darkInputField, { marginBottom: showSubTimePicker ? 0 : 24 }]}
                                onPress={() => setShowSubTimePicker(!showSubTimePicker)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.inputText, isDarkMode && styles.darkText]}>
                                    {selectedTime ? `${parseInt(selectedTime.split(':')[0], 10) > 12 ? parseInt(selectedTime.split(':')[0], 10) - 12 : selectedTime.split(':')[0]}:${selectedTime.split(':')[1]} ${parseInt(selectedTime.split(':')[0], 10) >= 12 ? 'PM' : 'AM'}` : 'Select a time'}
                                </Text>
                                <Text>🕒</Text>
                            </TouchableOpacity>

                            {/* Inline Time Picker */}
                            {showSubTimePicker && (
                                <View style={{ marginTop: 12, marginBottom: 24 }}>
                                    <View style={styles.timeGrid}>
                                        {TIME_SLOTS.map(time => {
                                            const isSubToday = subViewYear === currentYear && subViewMonth === currentMonth && subSelectedDate === currentDay;
                                            const past = isSubToday && parseInt(time.split(':')[0], 10) <= currentHour;
                                            return (
                                                <TouchableOpacity
                                                    key={time}
                                                    style={[
                                                        styles.timeSlot,
                                                        isDarkMode && styles.darkTimeSlot,
                                                        selectedTime === time && !past && styles.selectedTimeSlot,
                                                        past && { opacity: 0.3 },
                                                    ]}
                                                    onPress={() => { if (!past) { setSelectedTime(time); setShowSubTimePicker(false); } }}
                                                    disabled={past}
                                                >
                                                    <Text style={[
                                                        styles.timeText,
                                                        isDarkMode && styles.darkText,
                                                        selectedTime === time && !past && styles.selectedTimeText,
                                                    ]}>{time}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}

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
                        <View style={{ flex: 1 }}>
                            <Text style={styles.summaryLabel}>
                                {scheduleTab === 'single' ? 'SELECTED SCHEDULE' : 'SELECTED SUBSCRIPTION'}
                            </Text>
                            <Text style={[styles.summaryValue, isDarkMode && styles.darkSummaryText]} numberOfLines={2}>
                                {scheduleTab === 'single'
                                    ? `${DAY_NAMES[new Date(viewYear, viewMonth, selectedDate).getDay()]}, ${selectedDate} ${MONTH_NAMES[viewMonth].slice(0, 3)}`
                                    : `${subType.charAt(0).toUpperCase() + subType.slice(1)} from ${subSelectedDate} ${MONTH_NAMES[subViewMonth].slice(0, 3)}`
                                }
                            </Text>
                            <Text style={[styles.summarySubValue, isDarkMode && styles.darkSummaryText]}>
                                {`at ${selectedTime || '--:--'} • ${scheduledDuration} Hrs`}
                            </Text>
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
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    summaryValue: {
        color: '#1f2937',
        fontSize: 16,
        fontWeight: 'bold',
    },
    summarySubValue: {
        color: '#6b7280',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 2,
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
