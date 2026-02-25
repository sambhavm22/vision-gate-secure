/**
 * Saved Address Screen
 * Displays user's saved addresses with option to add new ones
 */

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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

interface SavedAddress {
    id: string;
    label: string;
    address: string;
    isSelected: boolean;
}

const SAMPLE_ADDRESSES: SavedAddress[] = [
    {
        id: '1',
        label: 'Home',
        address: '101 1st Floor, Galaxy\nGalaxy Apartments, Gallery Apartment,\nBJ Road, Ranwar, Bandra West, Mumbai,\nMaharashtra 400050, India',
        isSelected: true,
    },
];

export function SavedAddressScreen(): React.JSX.Element {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [addresses, setAddresses] = useState<SavedAddress[]>(SAMPLE_ADDRESSES);

    const handleAddAddress = () => {
        Alert.alert('Add Address', 'Address input form coming soon!');
    };

    const handleMoreOptions = (id: string) => {
        Alert.alert('Options', 'Edit / Delete options coming soon!');
    };

    const handleSelectAddress = (id: string) => {
        setAddresses(prev =>
            prev.map(addr => ({
                ...addr,
                isSelected: addr.id === id,
            }))
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Saved Address</Text>
                <TouchableOpacity style={styles.addButton} onPress={handleAddAddress}>
                    <Text style={styles.addButtonText}>+ Add address</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {addresses.length === 0 ? (
                    /* Empty State */
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>📍</Text>
                        <Text style={styles.emptyTitle}>No saved addresses</Text>
                        <Text style={styles.emptySubtitle}>
                            Add your frequently used addresses for faster booking
                        </Text>
                        <TouchableOpacity style={styles.emptyAddButton} onPress={handleAddAddress}>
                            <Text style={styles.emptyAddButtonText}>+ Add address</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    /* Address List */
                    addresses.map(addr => (
                        <TouchableOpacity
                            key={addr.id}
                            style={styles.addressCard}
                            onPress={() => handleSelectAddress(addr.id)}
                            activeOpacity={0.7}
                        >
                            {/* Location Pin */}
                            <View style={styles.pinContainer}>
                                <View style={styles.pinCircle}>
                                    <Text style={styles.pinIcon}>📍</Text>
                                </View>
                            </View>

                            {/* Address Details */}
                            <View style={styles.addressDetails}>
                                <View style={styles.labelRow}>
                                    <Text style={styles.addressLabel}>{addr.label}</Text>
                                    {addr.isSelected && (
                                        <View style={styles.selectedBadge}>
                                            <Text style={styles.selectedText}>SELECTED</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.addressText}>{addr.address}</Text>
                            </View>

                            {/* More Options */}
                            <TouchableOpacity
                                style={styles.moreButton}
                                onPress={() => handleMoreOptions(addr.id)}
                            >
                                <Text style={styles.moreIcon}>⋯</Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backArrow: {
        fontSize: 22,
        color: '#f8fafc',
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#f8fafc',
    },
    addButton: {
        backgroundColor: '#1e293b',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#334155',
    },
    addButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#f8fafc',
    },
    content: {
        padding: 16,
        paddingBottom: 40,
    },
    // Address Card
    addressCard: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    pinContainer: {
        marginRight: 14,
        marginTop: 2,
    },
    pinCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(236, 72, 153, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pinIcon: {
        fontSize: 20,
    },
    addressDetails: {
        flex: 1,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    addressLabel: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#f8fafc',
        marginRight: 10,
    },
    selectedBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    selectedText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#10b981',
        letterSpacing: 0.5,
    },
    addressText: {
        fontSize: 13,
        color: '#94a3b8',
        lineHeight: 20,
    },
    moreButton: {
        padding: 4,
        marginTop: 2,
    },
    moreIcon: {
        fontSize: 20,
        color: '#94a3b8',
        fontWeight: 'bold',
    },
    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingVertical: 80,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#f8fafc',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    emptyAddButton: {
        backgroundColor: '#10b981',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    emptyAddButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
