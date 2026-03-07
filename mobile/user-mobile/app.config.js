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
    plugins: [
        [
            'expo-notifications',
            {
                color: '#6366f1',
            },
        ],
        'expo-web-browser',
    ],
};
