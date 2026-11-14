import type {CapacitorConfig} from '@capacitor/cli';

// The iOS app runs the same React app from bundled files (npm run build:ios).
const config: CapacitorConfig = {
  appId: 'com.keyvanmahmoudi.nederlands',
  appName: 'Nedfa',
  webDir: 'dist-native',
  ios: {
    contentInset: 'never',
    backgroundColor: '#fcfaf6',
    limitsNavigationsToAppBoundDomains: false,
    preferredContentMode: 'mobile',
  },
  plugins: {
    SplashScreen: {launchAutoHide: false, backgroundColor: '#fbf7f2', showSpinner: false},
    StatusBar: {overlaysWebView: true, style: 'DEFAULT'},
    LocalNotifications: {iconColor: '#e8590c'},
  },
};

export default config;
