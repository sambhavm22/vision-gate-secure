/**
 * Home Screen
 * Displays user profile when authenticated
 */

import React from 'react';
import {
    ActivityIndicator,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import { getUserDisplayName, useUser } from '../hooks/useUser';

type HomeScreenProps = {
    onLogout: () => void;
};

export function HomeScreen({ onLogout }: HomeScreenProps): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const { user, loading, error } = useUser();

    const displayName = getUserDisplayName(user);

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
            <View style={styles.content}>
                <Text style={[styles.title, isDarkMode && styles.darkText]}>
                    HelperHub Mobile App
                </Text>
                <Text style={[styles.subtitle, isDarkMode && styles.darkText]}>
                    Welcome back!
                </Text>

                {/* User Profile Section */}
                <View style={[styles.profileSection, isDarkMode && styles.darkProfileSection]}>
                    <Text style={[styles.sectionTitle, isDarkMode && styles.darkTextMuted]}>
                        User Profile
                    </Text>

                    {loading ? (
                        <ActivityIndicator size="small" color={isDarkMode ? '#fff' : '#1a1a1a'} />
                    ) : error ? (
                        <Text style={styles.errorText}>Error: {error.message}</Text>
                    ) : user ? (
                        <View style={styles.userInfo}>
                            <Text style={[styles.userName, isDarkMode && styles.darkText]}>
                                {displayName}
                            </Text>
                            <Text style={[styles.userEmail, isDarkMode && styles.darkTextMuted]}>
                                {user.email}
                            </Text>
                        </View>
                    ) : (
                        <Text style={[styles.mockUser, isDarkMode && styles.darkText]}>
                            Demo User
                        </Text>
                    )}
                </View>

                {/* Status Section */}
                <View style={styles.statusContainer}>
                    <Text style={[styles.statusText, styles.successText]}>
                        ✓ Authenticated (Mock)
                    </Text>
                    <Text style={[styles.statusText, styles.successText]}>
                        ✓ Environment verified
                    </Text>
                    <Text style={[styles.statusText, styles.successText]}>
                        ✓ iOS ready
                    </Text>
                </View>

                {/* Logout Button */}
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={onLogout}
                >
                    <Text style={styles.logoutButtonText}>Sign Out</Text>
                </TouchableOpacity>

                {/* Mock Notice */}
                <Text style={[styles.mockNotice, isDarkMode && styles.darkTextMuted]}>
                    🔧 Demo Mode: Authentication is mocked
                </Text>
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
        backgroundColor: '#1a1a1a',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '400',
        color: '#666666',
        marginBottom: 32,
        textAlign: 'center',
    },
    darkText: {
        color: '#ffffff',
    },
    darkTextMuted: {
        color: '#999999',
    },
    profileSection: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
        width: '100%',
        maxWidth: 320,
        alignItems: 'center',
    },
    darkProfileSection: {
        backgroundColor: '#2a2a2a',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666666',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    userInfo: {
        alignItems: 'center',
    },
    userName: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#666666',
    },
    mockUser: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    errorText: {
        fontSize: 14,
        color: '#ef4444',
    },
    statusContainer: {
        alignItems: 'flex-start',
        marginBottom: 32,
    },
    statusText: {
        fontSize: 14,
        marginVertical: 4,
    },
    successText: {
        color: '#22c55e',
    },
    logoutButton: {
        backgroundColor: '#ef4444',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 32,
    },
    logoutButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    mockNotice: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        marginTop: 24,
    },
});
