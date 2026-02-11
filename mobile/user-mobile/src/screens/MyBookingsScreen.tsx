import React from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';

const MOCK_BOOKINGS = [
    { id: '1', service: 'House Cleaning', date: 'Fri, 14 Feb', status: 'Scheduled' },
    { id: '2', service: 'Plumbing Repair', date: 'Mon, 10 Feb', status: 'Completed' },
];

export function MyBookingsScreen(): React.JSX.Element {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>My Bookings</Text>

                <FlatList
                    data={MOCK_BOOKINGS}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.row}>
                                <Text style={styles.serviceName}>{item.service}</Text>
                                <Text style={[
                                    styles.status,
                                    item.status === 'Completed' ? styles.statusCompleted : styles.statusScheduled
                                ]}>
                                    {item.status}
                                </Text>
                            </View>
                            <Text style={styles.date}>{item.date}</Text>
                        </View>
                    )}
                    contentContainerStyle={styles.listContent}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#f8fafc',
        marginBottom: 24,
    },
    listContent: {
        gap: 16,
    },
    card: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    serviceName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#f8fafc',
    },
    date: {
        color: '#94a3b8',
        fontSize: 14,
    },
    status: {
        fontSize: 12,
        fontWeight: 'bold',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        overflow: 'hidden',
    },
    statusScheduled: {
        backgroundColor: '#0f766e', // Teal 700
        color: '#ccfbf1',
    },
    statusCompleted: {
        backgroundColor: '#334155', // Slate 700
        color: '#94a3b8',
    },
});
