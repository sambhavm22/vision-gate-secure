/**
 * HelperHub Splash Screen
 * Branded loading screen shown while the app initializes
 */

import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Easing,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export function SplashScreen(): React.JSX.Element {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const taglineFade = useRef(new Animated.Value(0)).current;
    const dotOpacity1 = useRef(new Animated.Value(0.3)).current;
    const dotOpacity2 = useRef(new Animated.Value(0.3)).current;
    const dotOpacity3 = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        // Logo entrance animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                tension: 80,
                useNativeDriver: true,
            }),
        ]).start();

        // Tagline fade in after logo
        Animated.timing(taglineFade, {
            toValue: 1,
            duration: 500,
            delay: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();

        // Subtle pulse on the icon
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 1200,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1200,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Loading dots animation
        const animateDot = (dot: Animated.Value, delay: number) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(dot, {
                        toValue: 1,
                        duration: 400,
                        delay,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot, {
                        toValue: 0.3,
                        duration: 400,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };
        animateDot(dotOpacity1, 0);
        animateDot(dotOpacity2, 200);
        animateDot(dotOpacity3, 400);
    }, []);

    return (
        <View style={styles.container}>
            {/* Background decoration — subtle gradient circles */}
            <View style={styles.bgCircle1} />
            <View style={styles.bgCircle2} />

            {/* Logo Area */}
            <Animated.View
                style={[
                    styles.logoContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                {/* Icon */}
                <Animated.View
                    style={[
                        styles.iconContainer,
                        { transform: [{ scale: pulseAnim }] },
                    ]}
                >
                    <View style={styles.iconInner}>
                        <Text style={styles.iconText}>H</Text>
                    </View>
                </Animated.View>

                {/* Brand Name */}
                <Text style={styles.brandName}>
                    Helper<Text style={styles.brandAccent}>Hub</Text>
                </Text>
            </Animated.View>

            {/* Tagline */}
            <Animated.View style={[styles.taglineContainer, { opacity: taglineFade }]}>
                <Text style={styles.tagline}>Your Home Services, Simplified</Text>
            </Animated.View>

            {/* Loading Dots */}
            <View style={styles.loadingContainer}>
                <Animated.View style={[styles.dot, { opacity: dotOpacity1 }]} />
                <Animated.View style={[styles.dot, { opacity: dotOpacity2 }]} />
                <Animated.View style={[styles.dot, { opacity: dotOpacity3 }]} />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>Making your life easier, one tap at a time</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Background decorative circles
    bgCircle1: {
        position: 'absolute',
        top: -80,
        right: -80,
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
    },
    bgCircle2: {
        position: 'absolute',
        bottom: -60,
        left: -60,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(16, 185, 129, 0.06)',
    },

    // Logo
    logoContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 28,
        backgroundColor: '#10b981',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        // Shadow
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
    },
    iconInner: {
        width: 80,
        height: 80,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconText: {
        fontSize: 44,
        fontWeight: '900',
        color: '#ffffff',
        letterSpacing: -1,
    },

    // Brand text
    brandName: {
        fontSize: 38,
        fontWeight: '800',
        color: '#1e293b',
        letterSpacing: -0.5,
    },
    brandAccent: {
        color: '#10b981',
    },

    // Tagline
    taglineContainer: {
        marginBottom: 48,
    },
    tagline: {
        fontSize: 16,
        color: '#64748b',
        fontWeight: '500',
        letterSpacing: 0.5,
    },

    // Loading dots
    loadingContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#10b981',
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 50,
    },
    footerText: {
        fontSize: 13,
        color: '#94a3b8',
        fontWeight: '400',
    },
});
