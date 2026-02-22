/**
 * Your Experts Screen
 * Shows experts who have visited the user
 */

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { RootStackParamList } from '../App';

export function YourExpertsScreen(): React.JSX.Element {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Your Experts</Text>
                <View style={{ width: 32 }} />
            </View>

            {/* Empty State */}
            <View style={styles.emptyContainer}>
                {/* People Icons */}
                <View style={styles.iconsRow}>
                    <View style={[styles.personCircle, styles.personLeft]}>
                        <Text style={styles.personEmoji}>🧑</Text>
                    </View>
                    <View style={[styles.personCircle, styles.personCenter]}>
                        <Text style={styles.personEmoji}>🧑</Text>
                    </View>
                    <View style={[styles.personCircle, styles.personRight]}>
                        <Text style={styles.personEmoji}>🧑</Text>
                    </View>
                </View>

                <Text style={styles.emptyTitle}>
                    All Experts who visited{'\n'}you appear here
                </Text>
                <Text style={styles.emptySubtitle}>
                    Why not make a booking right away?
                </Text>

                <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
                >
                    <Text style={styles.bookButtonText}>Book now</Text>
                </TouchableOpacity>
            </View>
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
    // Empty State
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        marginTop: -60,
    },
    iconsRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        marginBottom: 40,
        height: 80,
    },
    personCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    personLeft: {
        marginRight: -10,
        zIndex: 1,
    },
    personCenter: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginBottom: 20,
        zIndex: 2,
    },
    personRight: {
        marginLeft: -10,
        zIndex: 1,
    },
    personEmoji: {
        fontSize: 28,
    },
    emptyTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#f8fafc',
        textAlign: 'center',
        lineHeight: 34,
        marginBottom: 12,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 32,
    },
    bookButton: {
        backgroundColor: '#1e293b',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    bookButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#f8fafc',
    },
});
