import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RootStackParamList } from '../App';
import { getUserDisplayName, useUser } from '../hooks/useUser';
import { supabase } from '../services/supabase';

export function ProfileScreen(): React.JSX.Element {
    const { user } = useUser();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const displayName = getUserDisplayName(user);
    const email = user?.email || 'sambhavm22@gmail.com';
    const phone = user?.phone || 'Not provided';
    const initial = displayName.charAt(0).toUpperCase();

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const QUICK_ACTIONS = [
        { id: '1', title: 'My Bookings', subtitle: 'View all bookings', icon: '📅', color: '#ec4899', route: 'MyBookings' },
        { id: '2', title: 'My Wallet', subtitle: '₹0', icon: '👛', color: '#ec4899', route: 'Wallet' },
        { id: '3', title: 'All Offers', subtitle: '1 available', icon: '🏷️', color: '#ec4899' }, // No route yet
        { id: '4', title: 'Help & Support', subtitle: 'Get Quick Help', icon: '❓', color: '#ec4899', route: 'Support' },
    ];

    const MENU_ITEMS = [
        { id: '1', title: 'Your Experts', icon: '👥', route: 'YourExperts' },
        { id: '2', title: 'Saved Addresses', icon: '🏠', route: 'SavedAddress' },
        { id: '3', title: 'Manage Account', icon: '⚙️' },
    ];

    const handleQuickAction = (route?: string) => {
        if (route === 'MyBookings') {
            navigation.navigate('MainTabs', { screen: 'MyBookings' });
        } else if (route === 'Support') {
            navigation.navigate('Support');
        } else if (route === 'Wallet') {
            navigation.navigate('Wallet');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>

                {/* Profile Header Card */}
                <View style={styles.headerCard}>
                    <View style={styles.profileRow}>
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarText}>{initial}</Text>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>{displayName}</Text>
                            <Text style={styles.profileEmail}>{email}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.contactRow}>
                        <View style={styles.contactItem}>
                            <View style={styles.contactIconCircle}>
                                <Text style={styles.contactIcon}>✉️</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.contactLabel}>Email</Text>
                                <Text style={styles.contactValue} numberOfLines={1}>{email}</Text>
                            </View>
                        </View>
                        <View style={styles.contactItem}>
                            <View style={styles.contactIconCircle}>
                                <Text style={styles.contactIcon}>📞</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.contactLabel}>Phone</Text>
                                <Text style={styles.contactValue} numberOfLines={1}>{phone}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Quick Actions Grid */}
                <View style={styles.gridContainer}>
                    {QUICK_ACTIONS.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.gridItem}
                            onPress={() => item.route && handleQuickAction(item.route)}
                        >
                            <View style={[styles.gridIconCircle, { backgroundColor: item.color + '20' }]}>
                                <Text style={[styles.gridIcon, { color: item.color }]}>{item.icon}</Text>
                            </View>
                            <Text style={styles.gridTitle}>{item.title}</Text>
                            <Text style={styles.gridSubtitle}>{item.subtitle}</Text>
                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Refer & Earn Banner */}
                <TouchableOpacity style={styles.referBanner}>
                    <View style={styles.referIconCircle}>
                        <Text style={styles.referIcon}>🎁</Text>
                    </View>
                    <View style={styles.referContent}>
                        <Text style={styles.referTitle}>Earn ₹150</Text>
                        <Text style={styles.referSubtitle}>Refer your friends and earn now</Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>

                <Text style={styles.sectionHeaderTitle}>Manage Account</Text>

                {/* Manage Account List */}
                <View style={styles.menuList}>
                    {MENU_ITEMS.map((item, index) => (
                        <TouchableOpacity key={item.id} style={[styles.menuItem, index !== MENU_ITEMS.length - 1 && styles.menuItemBorder]} onPress={() => item.route && navigation.navigate(item.route as any)}>
                            <View style={styles.menuIconContainer}>
                                <Text style={styles.menuIcon}>{item.icon}</Text>
                            </View>
                            <Text style={styles.menuTitle}>{item.title}</Text>
                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Sign Out Button */}
                <TouchableOpacity style={styles.signOutButton} onPress={handleLogout}>
                    <Text style={styles.signOutIcon}>↪️</Text>
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>App version 3.1.9</Text>
                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a', // Dark background
    },
    content: {
        padding: 16,
        paddingBottom: 40,
    },
    // Header Card
    headerCard: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#0284c7', // Blue circle
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#f8fafc',
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 14,
        color: '#94a3b8',
    },
    divider: {
        height: 1,
        backgroundColor: '#334155',
        marginBottom: 20,
    },
    contactRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 8,
    },
    contactIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#fff', // White background for icon
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    contactIcon: {
        fontSize: 18,
    },
    contactLabel: {
        fontSize: 12,
        color: '#94a3b8',
        marginBottom: 2,
    },
    contactValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#f8fafc',
    },
    // Grid Styles
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 24,
    },
    gridItem: {
        width: '48%',
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 16,
        position: 'relative',
    },
    gridIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    gridIcon: {
        fontSize: 20,
    },
    gridTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#f8fafc',
        marginBottom: 4,
    },
    gridSubtitle: {
        fontSize: 12,
        color: '#94a3b8',
        marginBottom: 4,
    },
    chevron: {
        position: 'absolute',
        right: 16,
        top: '50%',
        marginTop: -10, // Approximate centering
        fontSize: 20,
        color: '#94a3b8',
        fontWeight: 'bold',
    },
    // Refer Banner
    referBanner: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    referIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(16, 185, 129, 0.1)', // Green tint
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    referIcon: {
        fontSize: 20,
        color: '#10b981',
    },
    referContent: {
        flex: 1,
    },
    referTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#f8fafc',
        marginBottom: 2,
    },
    referSubtitle: {
        fontSize: 12,
        color: '#94a3b8',
    },
    // Manage Account List
    sectionHeaderTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#94a3b8',
        marginBottom: 12,
        marginTop: 8,
    },
    menuList: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 24,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    menuIconContainer: {
        marginRight: 16,
    },
    menuIcon: {
        fontSize: 20,
        color: '#94a3b8',
    },
    menuTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: '#f8fafc',
    },
    // Add Address
    addAddressButton: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#334155', // Subtle border to distinguish
    },
    addAddressContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addAddressIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(59, 130, 246, 0.1)', // Blue tint
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    addAddressIcon: {
        fontSize: 18,
    },
    addAddressText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#f8fafc',
    },
    addAddressPlus: {
        fontSize: 24,
        color: '#3b82f6', // Bright blue
        fontWeight: 'bold',
    },
    // Sign Out
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#ef4444',
        borderRadius: 12,
        paddingVertical: 14,
        width: 140, // Fixed width for pill shape
        alignSelf: 'center',
        marginBottom: 32,
    },
    signOutIcon: {
        fontSize: 16,
        color: '#ef4444',
        marginRight: 8,
    },
    signOutText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ef4444',
    },
    versionText: {
        textAlign: 'center',
        color: '#64748b',
        fontSize: 12,
        marginBottom: 20,
    },
});
