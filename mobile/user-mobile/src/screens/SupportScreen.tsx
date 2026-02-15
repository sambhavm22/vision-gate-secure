import React, { useState } from 'react';
import { LayoutAnimation, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

type TabType = 'Booking' | 'Account' | 'Payments' | 'Feedback' | 'Safety';

interface FAQItem {
    id: string;
    question: string;
    answer: string;
}

const FAQS: Record<TabType, FAQItem[]> = {
    Booking: [
        { id: '1', question: 'How can I make a booking?', answer: 'To make a booking, go to the Home screen, select a service category, choose your preferred service, select a date and time, and confirm your booking.' },
        { id: '2', question: 'How is service price calculated?', answer: 'The service price is calculated based on the type of service, duration, and any additional materials required. You will see an estimated price before confirming.' },
        { id: '3', question: 'Is HelperHub available in my area?', answer: 'We are currently available in select cities. You can check availability by entering your location on the Home screen.' },
        { id: '4', question: 'Can I choose a preferred Expert?', answer: 'Yes, if you have booked with an expert before, you may have the option to request them again, subject to their availability.' },
    ],
    Account: [
        { id: '5', question: 'How do I reset my password?', answer: 'You can reset your password by going to the Login screen and tapping on "Forgot Password".' },
        { id: '6', question: 'How can I change my phone number?', answer: 'Please contact support to update your registered phone number.' },
    ],
    Payments: [
        { id: '7', question: 'What payment methods are accepted?', answer: 'We accept credit/debit cards, UPI, and cash on delivery.' },
        { id: '8', question: 'How do I get a refund?', answer: 'Refunds are processed according to our cancellation policy. Please contact support for assistance.' },
    ],
    Feedback: [
        { id: '9', question: 'How can I rate a service?', answer: 'After a service is completed, you will see a popup to rate the expert and provide feedback.' },
    ],
    Safety: [
        { id: '10', question: 'Are the experts verified?', answer: 'Yes, all our experts undergo a background verification process via DigiLocker.' },
    ],
};

export function SupportScreen(): React.JSX.Element {
    const [selectedTab, setSelectedTab] = useState<TabType>('Booking');
    const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

    const toggleExpand = (id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedMap(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const renderTab = (tab: TabType) => (
        <TouchableOpacity
            key={tab}
            style={[styles.tabItem, selectedTab === tab && styles.tabItemActive]}
            onPress={() => setSelectedTab(tab)}
        >
            <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>{tab}</Text>
            {selectedTab === tab && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.tabContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
                    {(['Booking', 'Account', 'Payments', 'Feedback', 'Safety'] as TabType[]).map(renderTab)}
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionHeader}>FAQs</Text>

                <View style={styles.faqList}>
                    {FAQS[selectedTab].map((item) => (
                        <View key={item.id} style={styles.faqItem}>
                            <TouchableOpacity
                                style={styles.faqHeader}
                                onPress={() => toggleExpand(item.id)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.faqQuestion}>{item.question}</Text>
                                <Text style={styles.chevron}>{expandedMap[item.id] ? '▲' : '▼'}</Text>
                            </TouchableOpacity>
                            {expandedMap[item.id] && (
                                <View style={styles.faqBody}>
                                    <Text style={styles.faqAnswer}>{item.answer}</Text>
                                </View>
                            )}
                        </View>
                    ))}
                </View>

                <TouchableOpacity
                    style={styles.viewMoreButton}
                >
                    <Text style={styles.viewMoreText}>View more</Text>
                    <Text style={styles.viewMoreIcon}>▼</Text>
                </TouchableOpacity>


                <Text style={styles.contactHeader}>Contact Us</Text>
                <TouchableOpacity style={styles.contactCard}>
                    <View style={styles.contactIconContainer}>
                        <Text style={styles.contactIcon}>💬</Text>
                        {/* Using emoji as a placeholder for the pink mail/chat icon */}
                    </View>
                    <View style={styles.contactInfo}>
                        <Text style={styles.contactTitle}>Chat with us</Text>
                        <Text style={styles.contactSubtitle}>Responds instantly</Text>
                    </View>
                    <Text style={styles.arrowIcon}>›</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a', // Dark theme background
    },
    tabContainer: {
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
        backgroundColor: '#1e293b',
    },
    tabContent: {
        paddingHorizontal: 16,
    },
    tabItem: {
        paddingVertical: 16,
        paddingHorizontal: 16,
        marginRight: 8,
        position: 'relative',
    },
    tabItemActive: {
        // active state styles
    },
    tabText: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '600',
    },
    tabTextActive: {
        color: '#ec4899', // Pink accent color
    },
    activeIndicator: {
        position: 'absolute',
        bottom: 0,
        left: 16,
        right: 16,
        height: 3,
        backgroundColor: '#ec4899',
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
    },
    content: {
        padding: 16,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#f8fafc',
        marginBottom: 16,
        marginTop: 8,
    },
    faqList: {
        marginBottom: 8,
    },
    faqItem: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
    },
    faqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    faqQuestion: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        color: '#f8fafc',
        marginRight: 8,
    },
    chevron: {
        fontSize: 12,
        color: '#94a3b8',
    },
    faqBody: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    faqAnswer: {
        fontSize: 13,
        color: '#94a3b8',
        lineHeight: 20,
    },
    viewMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
    },
    viewMoreText: {
        color: '#ec4899',
        fontWeight: '600',
        fontSize: 14,
        marginRight: 4,
    },
    viewMoreIcon: {
        color: '#ec4899',
        fontSize: 12,
    },
    contactHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#f8fafc',
        marginBottom: 16,
    },
    contactCard: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    contactIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(236, 72, 153, 0.1)', // Pink tint
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    contactIcon: {
        fontSize: 24,
    },
    contactInfo: {
        flex: 1,
    },
    contactTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#f8fafc',
        marginBottom: 4,
    },
    contactSubtitle: {
        fontSize: 13,
        color: '#94a3b8',
    },
    arrowIcon: {
        fontSize: 20,
        color: '#94a3b8',
        fontWeight: 'bold',
    },
});
