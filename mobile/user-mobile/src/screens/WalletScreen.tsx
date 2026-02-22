/**
 * Wallet Screen
 * Displays wallet balance, cash/bonus breakdown, referral, and transactions
 */

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { RootStackParamList } from '../App';

export function WalletScreen(): React.JSX.Element {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Wallet</Text>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Available Balance */}
                <View style={styles.balanceSection}>
                    <View style={styles.balanceLabelRow}>
                        <Text style={styles.walletEmoji}>💰</Text>
                        <Text style={styles.balanceLabel}>Available Balance</Text>
                    </View>
                    <Text style={styles.balanceAmount}>₹0</Text>
                </View>

                {/* Cash & Bonus Cards */}
                <View style={styles.cardsRow}>
                    <View style={styles.balanceCard}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardEmoji}>💵</Text>
                            <Text style={styles.cardLabel}>Cash</Text>
                        </View>
                        <Text style={styles.cardAmount}>₹0</Text>
                    </View>
                    <View style={styles.balanceCard}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardEmoji}>🎁</Text>
                            <Text style={styles.cardLabel}>Bonus</Text>
                        </View>
                        <Text style={styles.cardAmount}>₹0</Text>
                    </View>
                </View>

                {/* Refer & Earn Banner */}
                <TouchableOpacity style={styles.referBanner}>
                    <View style={styles.referIconCircle}>
                        <Text style={styles.referIcon}>🎁</Text>
                    </View>
                    <Text style={styles.referText}>Refer & Earn ₹150</Text>
                    <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>

                {/* Add Money Button */}
                <TouchableOpacity style={styles.addMoneyButton}>
                    <Text style={styles.addMoneyText}>Add money</Text>
                </TouchableOpacity>

                {/* Transactions Section */}
                <Text style={styles.transactionsTitle}>Transactions</Text>

                {/* Empty State */}
                <View style={styles.emptyState}>
                    <View style={styles.emptyIconsRow}>
                        <View style={[styles.emptyIconCircle, styles.emptyIconDown]}>
                            <Text style={styles.emptyArrow}>↓</Text>
                        </View>
                        <View style={[styles.emptyIconCircle, styles.emptyIconAlert]}>
                            <Text style={styles.emptyExclamation}>!</Text>
                        </View>
                        <View style={[styles.emptyIconCircle, styles.emptyIconUp]}>
                            <Text style={styles.emptyArrow}>↑</Text>
                        </View>
                    </View>
                    <Text style={styles.emptyText}>No transactions yet</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
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
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    // Available Balance
    balanceSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    balanceLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    walletEmoji: {
        fontSize: 18,
        marginRight: 8,
    },
    balanceLabel: {
        fontSize: 16,
        color: '#94a3b8',
        fontWeight: '500',
    },
    balanceAmount: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#f8fafc',
    },
    // Cash & Bonus Cards
    cardsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    balanceCard: {
        flex: 1,
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardEmoji: {
        fontSize: 16,
        marginRight: 8,
    },
    cardLabel: {
        fontSize: 14,
        color: '#94a3b8',
        fontWeight: '500',
    },
    cardAmount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#f8fafc',
    },
    // Refer & Earn
    referBanner: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#334155',
    },
    referIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    referIcon: {
        fontSize: 20,
    },
    referText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#f8fafc',
    },
    chevron: {
        fontSize: 22,
        color: '#94a3b8',
        fontWeight: 'bold',
    },
    // Add Money Button
    addMoneyButton: {
        backgroundColor: '#10b981',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 32,
    },
    addMoneyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    // Transactions
    transactionsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#f8fafc',
        marginBottom: 24,
    },
    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyIconsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 4,
    },
    emptyIconDown: {
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
    },
    emptyIconAlert: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        width: 56,
        height: 56,
        borderRadius: 28,
        zIndex: 1,
    },
    emptyIconUp: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
    },
    emptyArrow: {
        fontSize: 22,
        color: '#94a3b8',
        fontWeight: 'bold',
    },
    emptyExclamation: {
        fontSize: 26,
        color: '#ef4444',
        fontWeight: 'bold',
    },
    emptyText: {
        fontSize: 16,
        color: '#64748b',
        marginTop: 8,
    },
});
