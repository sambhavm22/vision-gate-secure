/**
 * Expo configuration for HelperHub User Mobile App (bare workflow).
 *
 * Native config is managed directly in:
 *   - ios/UserMobile/Info.plist (iOS permissions, URL schemes)
 *   - android/app/src/main/AndroidManifest.xml (Android permissions, intent filters)
 *
 * @type {import('expo/config').ExpoConfig}
 */
module.exports = {
    name: 'HelperHub',
    slug: 'helperhub-user',
    scheme: 'user-mobile',
    version: '3.1.9',
    jsEngine: 'hermes',
    ios: {
        bundleIdentifier: 'com.smm1997.helperhubuser',
    },
    android: {
        package: 'com.smm1997.helperhubuser',
    },
    plugins: [
        [
            'expo-notifications',
            {
                color: '#6366f1',
            },
        ],
        'expo-web-browser',
    ],
    extra: {
        eas: {
            projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID_USER || '78164ef1-4f1b-4dad-b90d-df1ea105778e',
        },
    },
};

