/**
 * Expo configuration for HelperHub User Mobile App (bare workflow).
 *
 * Native config is managed directly in:
 *   - ios/UserMobile/Info.plist (iOS permissions, URL schemes)
 *   - android/app/src/main/AndroidManifest.xml (Android permissions, intent filters)
 *
 * Only non-native Expo metadata is kept here to satisfy expo-doctor
 * without triggering the "non-CNG" sync warning.
 *
 * @type {import('expo/config').ExpoConfig}
 */
module.exports = {
    name: 'HelperHub',
    slug: 'helperhub-user',
    scheme: 'user-mobile',
    version: '3.1.9',
    plugins: [
        'expo-web-browser',
    ],
};
