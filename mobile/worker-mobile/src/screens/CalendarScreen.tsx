import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useUser } from '../hooks/useUser';
import { supabase } from '../services/supabase';

interface Job {
    id: string;
    service_name: string;
    status: string;
    scheduled_at: string;
    total_amount: number | null;
    customer_name?: string;
    address_line1?: string;
    city?: string;
}

export function CalendarScreen(): React.JSX.Element {
    const { workerProfile } = useUser();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split('T')[0]
    );

    const fetchJobs = useCallback(async () => {
        if (!workerProfile) return;
        try {
            // Fetch all assigned, accepted, en_route, and in_progress jobs
            const { data, error } = await supabase
                .from('bookings')
                .select('*, services(name), addresses(address_line1, city), profiles!bookings_customer_id_fkey(full_name)')
                .eq('worker_id', workerProfile.id)
                .in('status', ['accepted', 'en_route', 'in_progress', 'assigned'])
                .order('scheduled_at', { ascending: true });

            if (error) throw error;

            const mapped = (data || []).map((item: any) => ({
                ...item,
                service_name: item.services?.name || item.service_name || 'Service',
                customer_name: item.profiles?.full_name || 'Customer',
                address_line1: item.addresses?.address_line1,
                city: item.addresses?.city,
            }));

            setJobs(mapped);
        } catch (err) {
            console.error('Fetch calendar jobs error:', err);
        } finally {
            setLoading(false);
        }
    }, [workerProfile]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    // Real-time subscription to booking updates
    useEffect(() => {
        if (!workerProfile) return;
        const channel = supabase
            .channel('worker-calendar-jobs')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookings',
                    filter: `worker_id=eq.${workerProfile.id}`,
                },
                () => {
                    fetchJobs();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [workerProfile, fetchJobs]);

    // Generate marked dates for the calendar
    const markedDates = useMemo(() => {
        const marks: { [date: string]: any } = {};

        // Loop through all jobs and add a dot for each distinct date
        jobs.forEach(job => {
            if (!job.scheduled_at) return;
            const dateStr = job.scheduled_at.split('T')[0];

            if (!marks[dateStr]) {
                marks[dateStr] = {
                    marked: true,
                    dotColor: '#10b981', // Emerald green
                };
            }
        });

        // Add styling for the currently selected date
        if (marks[selectedDate]) {
            marks[selectedDate] = {
                ...marks[selectedDate],
                selected: true,
                selectedColor: '#10b981',
                selectedTextColor: '#ffffff',
            };
        } else {
            marks[selectedDate] = {
                selected: true,
                selectedColor: '#10b981',
                selectedTextColor: '#ffffff',
            };
        }

        return marks;
    }, [jobs, selectedDate]);

    // Filter jobs for the selected date
    const selectedDateJobs = useMemo(() => {
        return jobs.filter(job => {
            if (!job.scheduled_at) return false;
            return job.scheduled_at.startsWith(selectedDate);
        });
    }, [jobs, selectedDate]);

    const handleDayPress = (day: DateData) => {
        setSelectedDate(day.dateString);
    };

    const formatTime = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch { return ''; }
    };

    const renderJobCard = ({ item }: { item: Job }) => (
        <View style={styles.jobCard}>
            <View style={styles.cardHeader}>
                <Text style={styles.serviceName}>{item.service_name}</Text>
                <Text style={styles.timeText}>{formatTime(item.scheduled_at)}</Text>
            </View>
            {item.customer_name && (
                <Text style={styles.customerText}>👤 {item.customer_name}</Text>
            )}
            {item.address_line1 && (
                <Text style={styles.addressText}>
                    📍 {item.address_line1}{item.city ? `, ${item.city}` : ''}
                </Text>
            )}
            {item.total_amount && (
                <Text style={styles.amountText}>₹{item.total_amount}</Text>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Schedule</Text>
            </View>

            <View style={styles.calendarContainer}>
                <Calendar
                    theme={{
                        backgroundColor: '#0f172a',
                        calendarBackground: '#1e293b',
                        textSectionTitleColor: '#94a3b8',
                        selectedDayBackgroundColor: '#10b981',
                        selectedDayTextColor: '#ffffff',
                        todayTextColor: '#34d399',
                        dayTextColor: '#f8fafc',
                        textDisabledColor: '#475569',
                        dotColor: '#10b981',
                        selectedDotColor: '#ffffff',
                        arrowColor: '#f8fafc',
                        monthTextColor: '#f8fafc',
                        textMonthFontWeight: 'bold',
                    }}
                    onDayPress={handleDayPress}
                    markedDates={markedDates}
                    enableSwipeMonths={true}
                    firstDay={1} // Start week on Monday
                />
            </View>

            <View style={styles.agendaContainer}>
                <View style={styles.agendaHeader}>
                    <Text style={styles.agendaTitle}>
                        Jobs on {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{selectedDateJobs.length}</Text>
                    </View>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 40 }} />
                ) : (
                    <FlatList
                        data={selectedDateJobs}
                        keyExtractor={(item) => item.id}
                        renderItem={renderJobCard}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyIcon}>☕</Text>
                                <Text style={styles.emptyText}>No bookings on this day.</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#f8fafc' },
    calendarContainer: {
        marginBottom: 16,
        paddingHorizontal: 8,
    },
    agendaContainer: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    agendaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b',
        marginBottom: 8,
    },
    agendaTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#f8fafc',
        marginRight: 8,
    },
    badge: {
        backgroundColor: '#1e293b',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: 'bold',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    jobCard: {
        backgroundColor: '#1e293b',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderLeftWidth: 4,
        borderColor: '#334155',
        borderLeftColor: '#10b981',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#f8fafc',
    },
    timeText: {
        fontSize: 14,
        color: '#34d399',
        fontWeight: '600',
    },
    customerText: {
        fontSize: 14,
        color: '#cbd5e1',
        marginBottom: 4,
    },
    addressText: {
        fontSize: 13,
        color: '#94a3b8',
        marginTop: 4,
    },
    amountText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#10b981',
        marginTop: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 48,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
        opacity: 0.8,
    },
    emptyText: {
        fontSize: 15,
        color: '#64748b',
    },
});
