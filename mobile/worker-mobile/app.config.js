module.exports = {
    name: 'HelperHub Worker',
    slug: 'helperhub-worker',
    version: '1.0.0',
    scheme: 'worker-mobile',
    platforms: ['ios', 'android'],
    plugins: [
        [
            'expo-notifications',
            {
                color: '#10b981',
            },
        ],
        'expo-web-browser',
    ],
    extra: {
        eas: {
            projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID_WORKER || '5bb5dfb8-e366-418f-b1d8-14afda027f9d',
        },
    },
};
