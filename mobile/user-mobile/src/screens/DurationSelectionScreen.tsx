import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';
import { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'DurationSelection'>;

export function DurationSelectionScreen({ route, navigation }: Props): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const { serviceId, serviceName } = route.params;

    const DURATION_OPTIONS = [
        { id: '1', label: '1 hr', price: 200, originalPrice: 320, discount: '38% OFF' },
        { id: '2', label: '1.5 hrs', price: 300, originalPrice: 480, discount: '38% OFF' },
        { id: '3', label: '2 hrs', price: 400, originalPrice: 640, discount: '38% OFF' },
        { id: '4', label: '3 hrs', price: 600, originalPrice: 960, discount: '38% OFF' },
    ];

    const handleDurationConfirm = (durationOption: typeof DURATION_OPTIONS[0]) => {
        navigation.navigate('Booking', {
            serviceId,
            serviceName,
            bookingType: 'now',
            duration: parseFloat(durationOption.label),
            price: durationOption.price
        });
    };

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={[styles.title, isDarkMode && styles.darkTitle]}>
                        Select duration of service
                    </Text>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                        <Text style={{ fontSize: 24, color: isDarkMode ? '#cbd5e1' : '#475569' }}>✕</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.arrivingBadge}>
                    <Text style={styles.arrivingText}>Arriving in 15 Min</Text>
                </View>

                <View style={styles.grid}>
                    {DURATION_OPTIONS.map((option) => (
                        <View key={option.id} style={[styles.card, isDarkMode && styles.darkCard]}>
                            <View style={styles.discountBadge}>
                                <Text style={styles.discountText}>{option.discount}</Text>
                            </View>
                            <Text style={[styles.durationText, isDarkMode && styles.darkText]}>{option.label}</Text>
                            <View style={styles.priceContainer}>
                                <Text style={styles.priceText}>₹{option.price}</Text>
                                <Text style={styles.originalPriceText}>₹{option.originalPrice}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.bookButton}
                                onPress={() => handleDurationConfirm(option)}
                            >
                                <Text style={styles.bookButtonText}>Book</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                <Text style={styles.footerText}>
                    Need service for longer? Book for a Full Day or Custom hours
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
        padding: 20,
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
        marginTop: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0f172a',
        maxWidth: '80%',
    },
    darkTitle: {
        color: 'white',
    },
    closeButton: {
        padding: 4,
    },
    arrivingBadge: {
        alignSelf: 'flex-end',
        backgroundColor: '#fce7f3',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginBottom: 30,
    },
    arrivingText: {
        color: '#db2777',
        fontWeight: 'bold',
        fontSize: 14
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        justifyContent: 'space-between',
    },
    card: {
        width: '47%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    darkCard: {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
    },
    discountBadge: {
        backgroundColor: '#d1fae5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 12,
    },
    discountText: {
        color: '#10b981',
        fontWeight: 'bold',
        fontSize: 12,
    },
    durationText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 8,
    },
    darkText: {
        color: '#f8fafc',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    priceText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#94a3b8', // Muted slate for price in dark card looks better if slightly brighter, but matching image style
        marginRight: 8,
    },
    originalPriceText: {
        fontSize: 14,
        color: '#64748b',
        textDecorationLine: 'line-through',
    },
    bookButton: {
        backgroundColor: '#0f172a', // Dark button
        width: '100%',
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#db2777', // Pink border as per image
    },
    bookButtonText: {
        color: '#db2777',
        fontWeight: 'bold',
        fontSize: 16,
    },
    footerText: {
        color: '#db2777',
        textAlign: 'center',
        marginTop: 30,
        fontSize: 14,
        paddingHorizontal: 20,
        lineHeight: 20,
    },
});
