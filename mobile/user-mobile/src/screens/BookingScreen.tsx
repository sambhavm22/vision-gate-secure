import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Linking,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';
import { RootStackParamList } from '../App';
import { useLocation } from '../hooks/useLocation';
import { supabase } from '../services/supabase';

type Props = NativeStackScreenProps<RootStackParamList, 'Booking'>;

export function BookingScreen({ route, navigation }: Props): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const { serviceId, serviceName, bookingType, duration, price, date, time } = route.params;

    const [address, setAddress] = useState({
        fullAddress: '',
        city: '',
        zip: '',
        label: 'Home' as 'Home' | 'Work' | 'Other',
        lat: null as number | null,
        lng: null as number | null,
    });

    const [loading, setLoading] = useState(false);

    // expo-location hook for cross-platform location fetching
    const { loading: fetchingLocation, error: locationError, getCurrentLocation } = useLocation();

    const handleUseCurrentLocation = async () => {
        // Uses expo-location — works on Expo Go, iOS Simulator, and Android Emulator
        const locationAddress = await getCurrentLocation();

        if (locationAddress) {
            setAddress(prev => ({
                ...prev,
                fullAddress: locationAddress.fullAddress,
                city: locationAddress.city,
                zip: locationAddress.zip,
                lat: locationAddress.latitude,
                lng: locationAddress.longitude,
            }));
            Alert.alert('Location Fetched', 'Address filled from current location.');
        } else if (locationError) {
            Alert.alert('Location Error', locationError);
        }
    };

    const handleProceedToPayment = async () => {
        if (!address.fullAddress || !address.city || !address.zip) {
            Alert.alert('Missing Address', 'Please provide a valid address, city, and pincode.');
            return;
        }

        let coords = { lat: address.lat, lng: address.lng };
        if (coords.lat == null || coords.lng == null) {
            const locationAddress = await getCurrentLocation();
            if (!locationAddress) {
                Alert.alert(
                    'Location Required',
                    'Please enable location permission/GPS to continue booking.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Open Settings', onPress: () => Linking.openSettings() },
                    ]
                );
                return;
            }

            coords = {
                lat: locationAddress.latitude,
                lng: locationAddress.longitude,
            };
            setAddress(prev => ({
                ...prev,
                lat: locationAddress.latitude,
                lng: locationAddress.longitude,
            }));
        }

        setLoading(true);
        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                Alert.alert('Error', 'You must be logged in to book a service.');
                setLoading(false);
                return;
            }

            // 1. Create address record
            const { data: addressData, error: addressError } = await supabase
                .from('addresses')
                .insert({
                    customer_id: user.id,
                    label: address.label,
                    address_line1: address.fullAddress,
                    city: address.city,
                    postal_code: parseInt(address.zip, 10) || null,
                    lat: coords.lat,
                    lng: coords.lng,
                })
                .select('id')
                .single();

            if (addressError) {
                console.log('Address insert error:', addressError.message);
                // Continue without address_id if insert fails
            }

            // 2. Determine scheduled_at
            let scheduledAt: string;
            if (bookingType === 'prebook' && date && time) {
                // Extract YYYY-MM-DD from date string (handles both "2026-02-25" and "Starting 2026-02-25 (daily)")
                const dateMatch = date.match(/(\d{4}-\d{2}-\d{2})/);
                const rawDate = dateMatch ? dateMatch[1] : null;

                if (rawDate) {
                    const parsed = new Date(`${rawDate}T${time}`);
                    if (!isNaN(parsed.getTime())) {
                        scheduledAt = parsed.toISOString();
                    } else {
                        // Fallback: schedule 30 min from now
                        const fallback = new Date();
                        fallback.setMinutes(fallback.getMinutes() + 30);
                        scheduledAt = fallback.toISOString();
                    }
                } else {
                    const fallback = new Date();
                    fallback.setMinutes(fallback.getMinutes() + 30);
                    scheduledAt = fallback.toISOString();
                }
            } else {
                // For "now" bookings, schedule 30 min from now
                const now = new Date();
                now.setMinutes(now.getMinutes() + 30);
                scheduledAt = now.toISOString();
            }

            // 3. Determine notes (include subscription type if applicable)
            const subMatch = date?.match(/\((daily|alternate)\)/i);
            const notesText = subMatch
                ? `${serviceName} - ${address.label} (Subscription: ${subMatch[1]})`
                : `${serviceName} - ${address.label}`;

            // 4. Insert booking
            const { error: bookingError } = await supabase
                .from('bookings')
                .insert({
                    customer_id: user.id,
                    service_id: parseInt(serviceId, 10),
                    address_id: addressData?.id || null,
                    status: 'requested',
                    scheduled_at: scheduledAt,
                    duration_minutes: duration ? duration * 60 : 60,
                    total_amount: price || 400,
                    notes: notesText,
                });

            if (bookingError) {
                Alert.alert('Booking Error', bookingError.message);
                setLoading(false);
                return;
            }

            setLoading(false);
            Alert.alert(
                'Booking Confirmed! ✅',
                `Your ${serviceName} service has been booked for ₹${price || 400}.\n\nYou can view it in My Bookings.`,
                [
                    {
                        text: 'View My Bookings',
                        onPress: () => {
                            navigation.navigate('MainTabs', { screen: 'MyBookings' });
                        },
                    },
                    {
                        text: 'OK',
                        onPress: () => navigation.popToTop(),
                    },
                ]
            );
        } catch (err) {
            setLoading(false);
            Alert.alert('Error', err instanceof Error ? err.message : 'Something went wrong');
        }
    };

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    {/* Search Bar */}
                    <View style={[styles.searchBar, isDarkMode && styles.darkSearchBar]}>
                        <Text style={styles.searchIcon}>🔍</Text>
                        <TextInput
                            style={[styles.searchInput, isDarkMode && styles.darkText]}
                            placeholder="Search for an address..."
                            placeholderTextColor="#9ca3af"
                        />
                    </View>
                </View>

                {/* Map Placeholder */}
                <View style={[styles.mapPlaceholder, isDarkMode && styles.darkMapPlaceholder]}>
                    <Text style={{ fontSize: 40 }}>🗺️</Text>
                    <Text style={{ color: isDarkMode ? '#cbd5e1' : '#64748b' }}>Map View</Text>
                </View>

                {/* Use Current Location Button */}
                <TouchableOpacity
                    style={[styles.useLocationBtn, isDarkMode && styles.darkUseLocationBtn]}
                    onPress={handleUseCurrentLocation}
                    disabled={fetchingLocation}
                >
                    {fetchingLocation ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <Text style={{ marginRight: 8, fontSize: 16 }}>📍</Text>
                            <Text style={styles.useLocationText}>Use Current Location</Text>
                        </>
                    )}
                </TouchableOpacity>

                <ScrollView contentContainerStyle={styles.content}>

                    {/* Label Selection */}
                    <Text style={[styles.labelTitle, isDarkMode && styles.darkText]}>Label</Text>
                    <View style={styles.labelRow}>
                        {['Home', 'Work', 'Other'].map((label) => (
                            <TouchableOpacity
                                key={label}
                                style={[
                                    styles.labelChip,
                                    address.label === label && styles.activeLabelChip
                                ]}
                                onPress={() => setAddress({ ...address, label: label as any })}
                            >
                                <Text style={[
                                    styles.labelText,
                                    address.label === label && styles.activeLabelText
                                ]}>{label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Form Fields */}
                    <View style={styles.formGroup}>
                        <Text style={[styles.inputLabel, isDarkMode && styles.darkTextMuted]}>Address Line</Text>
                        <TextInput
                            style={[styles.input, isDarkMode && styles.darkInput, isDarkMode && styles.darkText]}
                            placeholder="House/Flat No, Street, Area"
                            placeholderTextColor="#64748b"
                            value={address.fullAddress}
                            onChangeText={(text) => setAddress({ ...address, fullAddress: text })}
                        />
                    </View>

                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={[styles.formGroup, { flex: 1 }]}>
                            <Text style={[styles.inputLabel, isDarkMode && styles.darkTextMuted]}>City</Text>
                            <TextInput
                                style={[styles.input, isDarkMode && styles.darkInput, isDarkMode && styles.darkText]}
                                placeholder="City"
                                placeholderTextColor="#64748b"
                                value={address.city}
                                onChangeText={(text) => setAddress({ ...address, city: text })}
                            />
                        </View>
                        <View style={[styles.formGroup, { flex: 1 }]}>
                            <Text style={[styles.inputLabel, isDarkMode && styles.darkTextMuted]}>Pincode</Text>
                            <TextInput
                                style={[styles.input, isDarkMode && styles.darkInput, isDarkMode && styles.darkText]}
                                placeholder="Pincode"
                                keyboardType="number-pad"
                                placeholderTextColor="#64748b"
                                value={address.zip}
                                onChangeText={(text) => setAddress({ ...address, zip: text })}
                            />
                        </View>
                    </View>

                    {/* Booking Review (Small) */}
                    <View style={[styles.reviewContainer, isDarkMode && styles.darkReviewContainer]}>
                        <Text style={[styles.reviewText, isDarkMode && styles.darkText]}>
                            Booking: {serviceName} • ₹{price || 400}
                        </Text>
                    </View>

                </ScrollView>

                {/* Footer Action */}
                <View style={[styles.footer, isDarkMode && styles.darkFooter]}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={[styles.cancelButtonText, isDarkMode && styles.darkText]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.saveButton, loading && styles.disabledButton]}
                        onPress={handleProceedToPayment}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save & Select</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc', // Light bg
    },
    darkContainer: {
        backgroundColor: '#0f172a', // Dark bg #0f172a or #111827
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e2e8f0',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 48,
        borderWidth: 1,
        borderColor: '#cbd5e1',
    },
    darkSearchBar: {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
    },
    searchIcon: {
        fontSize: 18,
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#0f172a',
    },
    mapPlaceholder: {
        height: 200,
        backgroundColor: '#cbd5e1',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 16,
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
    },
    darkMapPlaceholder: {
        backgroundColor: '#334155',
        // In a real app, this would be the MapView
    },
    useLocationBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1e293b', // Dark button as per image
        marginHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 8,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#334155',
    },
    darkUseLocationBtn: {
        backgroundColor: '#1e293b',
        borderColor: '#475569',
    },
    useLocationText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    content: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    labelTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#0f172a',
    },
    labelRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    labelChip: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#64748b',
    },
    activeLabelChip: {
        backgroundColor: '#10b981', // Green active
        borderColor: '#10b981',
    },
    labelText: {
        color: '#64748b',
        fontWeight: '600',
    },
    activeLabelText: {
        color: 'white',
    },
    formGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 8,
    },
    input: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#94a3b8',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        color: '#0f172a',
    },
    darkInput: {
        borderColor: '#475569',
        color: '#f8fafc',
    },
    darkText: {
        color: '#f8fafc',
    },
    darkTextMuted: {
        color: '#94a3b8',
    },
    reviewContainer: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#e2e8f0',
        borderRadius: 8,
    },
    darkReviewContainer: {
        backgroundColor: '#1e293b',
    },
    reviewText: {
        fontSize: 12,
        color: '#475569',
        textAlign: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#f8fafc',
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    darkFooter: {
        backgroundColor: '#0f172a',
        borderTopColor: '#1e293b',
    },
    cancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    saveButton: {
        backgroundColor: '#10b981', // Green
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 8,
    },
    disabledButton: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
