# HelperHub User Mobile App

React Native CLI mobile app skeleton for the HelperHub platform.

## Version Compatibility

| Component | Version |
|-----------|---------|
| React Native | 0.76.9 |
| React | 18.3.1 |
| Metro | 0.81.x |
| Min iOS | 15.1 |
| Min Android SDK | 24 (Android 7) |

## Prerequisites

- Node.js 18+
- Xcode 16.3+ (for iOS)
- Android Studio with JDK 17+ (for Android)
- CocoaPods 1.15+

## Setup

```bash
cd mobile/user-mobile
npm install
```

### iOS Setup

```bash
cd ios
pod install
cd ..
```

## Run Instructions

### Start Metro Bundler

```bash
npx react-native start
```

### Android

```bash
# Start an Android emulator first, then:
npx react-native run-android
```

### iOS Simulator

```bash
npx react-native run-ios
```

### Real iPhone

1. Open `ios/UserMobile.xcworkspace` in Xcode
2. Select your iPhone as the target device
3. Configure code signing in Xcode:
   - Go to Signing & Capabilities
   - Select your Development Team
   - Ensure bundle identifier is unique
4. Build and run (Cmd + R)

## Project Structure

```
mobile/user-mobile/
├── android/           # Android native project
├── ios/               # iOS native project
├── src/
│   ├── App.tsx        # Root component
│   ├── screens/       # Screen components (empty)
│   ├── components/    # Reusable components (empty)
│   ├── navigation/    # Navigation config (empty)
│   ├── services/      # API services (empty)
│   ├── hooks/         # Custom hooks (empty)
│   └── utils/         # Utility functions (empty)
├── index.js           # Entry point
├── package.json       # Dependencies
└── tsconfig.json      # TypeScript config
```

## Troubleshooting

### Clear Metro Cache

```bash
npx react-native start --reset-cache
```

### Clean iOS Build

```bash
cd ios
xcodebuild clean
pod install
cd ..
```

### Clean Android Build

```bash
cd android
./gradlew clean
cd ..
```
