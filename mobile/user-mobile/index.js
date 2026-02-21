/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './src/App';

// App name must match the name registered in native projects (ios/android)
const appName = 'UserMobile';

AppRegistry.registerComponent(appName, () => App);
AppRegistry.registerComponent('main', () => App);
