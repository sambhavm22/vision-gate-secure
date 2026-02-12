/**
 * Home Screen
 * Displays services and offers
 */

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';
import { RootStackParamList } from '../App';
import { getUserDisplayName, useUser } from '../hooks/useUser';

// Service Types
const SERVICES = [
    { id: '1', name: 'Everyday Cleaning', icon: '✨', color: '#3b82f6' },
    { id: '2', name: 'Weekly Cleaning', icon: '📅', color: '#8b5cf6' },
    { id: '3', name: 'Laundry', icon: '🧺', color: '#f59e0b' },
    { id: '4', name: 'Dishwashing', icon: '🍽️', color: '#10b981' },
    { id: '5', name: 'Bathroom Cleaning', icon: '🚿', color: '#06b6d4' },
    { id: '6', name: 'Kitchen Prep', icon: '🔪', color: '#ef4444' },
];

const SERVICE_GUIDELINES: Record<string, { dos: string[]; donts: string[] }> = {
    "Everyday Cleaning": {
        dos: ["Clear clutter before the cleaner arrives.", "Secure pets.", "Provide access to cleaning supplies."],
        donts: ["Don't expect deep stain removal in a standard clean.", "Don't hover over the cleaner while they work."]
    },
    "Weekly Cleaning": {
        dos: ["List priority areas.", "Ensure electricity and water access."],
        donts: ["Don't add extra tasks last minute."]
    },
    "Laundry": {
        dos: ["Separate whites and colored clothes.", "Check pockets for loose items.", "Provide detergent."],
        donts: ["Don't overload the washing machine.", "Don't mix heavily soiled items."]
    },
    "Dishwashing": {
        dos: ["Scrape leftover food into the bin.", "Soak stubborn stains.", "Provide dish soap and sponges."],
        donts: ["Don't leave sharp knives in soapy water.", "Don't overload the dishwasher."]
    },
    "Bathroom Cleaning": {
        dos: ["Remove personal items from counters.", "Ventilate the area."],
        donts: ["Don't use bleach without ventilation."]
    },
    "Kitchen Prep": {
        dos: ["Provide clear instructions on cuts/sizes.", "Ensure knives are sharp."],
        donts: ["Don't leave expired food in the fridge unless requested."]
    }
};

export function HomeScreen(): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const { user } = useUser();
    const displayName = getUserDisplayName(user);
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();




    const [modalVisible, setModalVisible] = useState(false);
    const [selectedService, setSelectedService] = useState<typeof SERVICES[0] | null>(null);



    const DURATION_OPTIONS = [
        { id: '1', label: '1 hr', price: 200, originalPrice: 320, discount: '38% OFF' },
        { id: '2', label: '1.5 hrs', price: 300, originalPrice: 480, discount: '38% OFF' },
        { id: '3', label: '2 hrs', price: 400, originalPrice: 640, discount: '38% OFF' },
        { id: '4', label: '3 hrs', price: 600, originalPrice: 960, discount: '38% OFF' },
    ];



    const handleServicePress = (service: typeof SERVICES[0]) => {
        setSelectedService(service);
        setModalVisible(true);
    };

    const handleBooking = (type: 'now' | 'prebook') => {
        setModalVisible(false);
        if (selectedService) {
            if (type === 'now') {
                navigation.navigate('DurationSelection', {
                    serviceId: selectedService.id,
                    serviceName: selectedService.name
                });
            } else {
                navigation.navigate('Schedule', {
                    serviceId: selectedService.id,
                    serviceName: selectedService.name
                });
            }
        }
    };



    const guidelines = selectedService ? SERVICE_GUIDELINES[selectedService.name] : null;

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.greeting, isDarkMode && styles.darkTextMuted]}>
                            Hello,
                        </Text>
                        <Text style={[styles.userName, isDarkMode && styles.darkText]}>
                            {displayName} 👋
                        </Text>
                    </View>
                    <View style={styles.locationBadge}>
                        <Text style={styles.locationText}>📍 Home</Text>
                    </View>
                </View>

                {/* Hero / Offer Banner */}
                <View style={styles.banner}>
                    <View style={styles.bannerContent}>
                        <Text style={styles.bannerTitle}>Special Offer!</Text>
                        <Text style={styles.bannerSubtitle}>Get 20% off on your first deep cleaning service.</Text>
                        <TouchableOpacity
                            style={styles.bannerButton}
                            onPress={() => handleServicePress(SERVICES[0])}
                        >
                            <Text style={styles.bannerButtonText}>Book Now</Text>
                        </TouchableOpacity>
                    </View>
                    {/* Placeholder for banner image */}
                    <View style={styles.bannerImagePlaceholder}>
                        <Text style={{ fontSize: 40 }}>✨</Text>
                    </View>
                </View>

                {/* Services Grid */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
                        Our Services
                    </Text>
                    <View style={styles.grid}>
                        {SERVICES.map((service) => (
                            <TouchableOpacity
                                key={service.id}
                                style={[styles.card, isDarkMode && styles.darkCard]}
                                onPress={() => handleServicePress(service)}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: service.color + '20' }]}>
                                    <Text style={{ fontSize: 24 }}>{service.icon}</Text>
                                </View>
                                <Text style={[styles.serviceName, isDarkMode && styles.darkText]}>
                                    {service.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Why Choose Us */}
                <View style={styles.whyChooseSection}>
                    <Text style={styles.whyChooseTitle}>
                        Why Choose HelperHub?
                    </Text>
                    <View style={styles.featuresContainer}>
                        <View style={styles.featureItem}>
                            <View style={styles.featureIconContainer}>
                                <Text style={styles.featureIcon}>🛡️</Text>
                            </View>
                            <Text style={styles.featureTitle}>Verified Professionals</Text>
                            <Text style={styles.featureDescription}>Every helper undergoes a strict background check.</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <View style={styles.featureIconContainer}>
                                <Text style={styles.featureIcon}>⏰</Text>
                            </View>
                            <Text style={styles.featureTitle}>On-Time Service</Text>
                            <Text style={styles.featureDescription}>Our professionals are punctual and efficient.</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <View style={styles.featureIconContainer}>
                                <Text style={styles.featureIcon}>✨</Text>
                            </View>
                            <Text style={styles.featureTitle}>Quality Guarantee</Text>
                            <Text style={styles.featureDescription}>Not satisfied? We will redo the service.</Text>
                        </View>
                    </View>
                </View>

            </ScrollView>

            {/* Service Guidelines Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, isDarkMode && styles.darkText]}>{selectedService?.name}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                                <Text style={{ fontSize: 20, color: '#94a3b8' }}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.guidelinesScroll}>
                            {/* Do's */}
                            <View style={styles.guidelineSection}>
                                <Text style={styles.guidelineHeaderDo}>✅ Do's</Text>
                                {guidelines?.dos.map((item, index) => (
                                    <View key={index} style={styles.bulletPoint}>
                                        <Text style={[styles.bulletText, isDarkMode && styles.darkTextMuted]}>• {item}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* Don'ts */}
                            <View style={styles.guidelineSection}>
                                <Text style={styles.guidelineHeaderDont}>❌ Don'ts</Text>
                                {guidelines?.donts.map((item, index) => (
                                    <View key={index} style={styles.bulletPoint}>
                                        <Text style={[styles.bulletText, isDarkMode && styles.darkTextMuted]}>• {item}</Text>
                                    </View>
                                ))}
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.primaryButton]}
                                onPress={() => handleBooking('now')}
                            >
                                <Text style={styles.buttonText}>Book Now</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.secondaryButton]}
                                onPress={() => handleBooking('prebook')}
                            >
                                <Text style={[styles.buttonText, styles.secondaryButtonText]}>Book Later</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>



            {/* Schedule Service Modal (Pre-book) */}

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    darkContainer: {
        backgroundColor: '#0f172a',
    },
    scrollContent: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    greeting: {
        fontSize: 14,
        color: '#64748b',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    darkText: {
        color: '#f8fafc',
    },
    darkTextMuted: {
        color: '#94a3b8',
    },
    locationBadge: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    locationText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
    },
    banner: {
        backgroundColor: '#1e293b',
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
        overflow: 'hidden',
    },
    bannerContent: {
        flex: 1,
        marginRight: 16,
    },
    bannerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    bannerSubtitle: {
        fontSize: 12,
        color: '#cbd5e1',
        marginBottom: 12,
    },
    bannerButton: {
        backgroundColor: '#10b981',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    bannerButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    bannerImagePlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#ffffff20',
        alignItems: 'center',
        justifyContent: 'center',
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    card: {
        width: '47%', // Approx 2 columns
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    darkCard: {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    serviceName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        textAlign: 'center',
    },
    // Why Choose Us Styles
    whyChooseSection: {
        backgroundColor: '#0f172a', // Dark background like image
        borderRadius: 20,
        padding: 24,
        marginBottom: 32,
        alignItems: 'center',
    },
    whyChooseTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 24,
        textAlign: 'center',
    },
    featuresContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: 12,
    },
    featureItem: {
        alignItems: 'center',
        flex: 1,
    },
    featureIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(16, 185, 129, 0.1)', // Green tint
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    featureIcon: {
        fontSize: 24,
        color: '#10b981', // Green icon color if supported, else emoji shows native
    },
    featureTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 6,
    },
    featureDescription: {
        fontSize: 10,
        color: '#94a3b8', // Muted text
        textAlign: 'center',
        lineHeight: 14,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    darkModalContent: {
        backgroundColor: '#1e293b',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    closeButton: {
        padding: 5,
    },
    guidelinesScroll: {
        marginBottom: 20,
    },
    guidelineSection: {
        marginBottom: 20,
    },
    guidelineHeaderDo: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#16a34a', // Green
        marginBottom: 10,
    },
    guidelineHeaderDont: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#dc2626', // Red
        marginBottom: 10,
    },
    bulletPoint: {
        marginBottom: 8,
        paddingLeft: 4,
    },
    bulletText: {
        fontSize: 16,
        color: '#334155',
        lineHeight: 24,
    },
    modalFooter: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 'auto',
    },
    actionButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButton: {
        backgroundColor: '#10b981',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#10b981',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    secondaryButtonText: {
        color: '#10b981',
    },
});
