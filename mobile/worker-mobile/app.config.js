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
            projectId: 'your-eas-project-id',
        },
    },
};
