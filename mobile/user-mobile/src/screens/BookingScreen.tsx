import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Booking'>;

export function BookingScreen({ route }: Props): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const { serviceId, serviceName, bookingType } = route.params;

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
            <View style={styles.content}>
                <Text style={[styles.title, isDarkMode && styles.darkText]}>
                    {bookingType === 'prebook' ? 'Pre-booking' : 'Booking'}
                </Text>
                <Text style={[styles.subtitle, isDarkMode && styles.darkTextMuted]}>
                    {serviceName}
                </Text>

                <View style={[styles.card, isDarkMode && styles.darkCard]}>
                    <Text style={[styles.infoText, isDarkMode && styles.darkText]}>
                        Service ID: {serviceId}
                    </Text>
                    <Text style={[styles.infoText, isDarkMode && styles.darkText]}>
                        Type: {bookingType === 'now' ? 'Immediate' : 'Scheduled'}
                    </Text>
                </View>

                {/* Placeholder for actual booking form */}
                <Text style={[styles.placeholder, isDarkMode && styles.darkTextMuted]}>
                    Booking form implementation coming soon...
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    darkContainer: {
        backgroundColor: '#0f172a',
    },
    content: {
        padding: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 20,
        color: '#64748b',
        marginBottom: 32,
    },
    darkText: {
        color: '#f8fafc',
    },
    darkTextMuted: {
        color: '#94a3b8',
    },
    card: {
        padding: 16,
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        marginBottom: 24,
    },
    darkCard: {
        backgroundColor: '#1e293b',
    },
    infoText: {
        fontSize: 16,
        marginBottom: 8,
        color: '#334155',
    },
    placeholder: {
        textAlign: 'center',
        marginTop: 40,
        fontStyle: 'italic',
        color: '#94a3b8',
    },
});
