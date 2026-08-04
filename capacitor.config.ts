import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.affirmationflow.app',
  appName: 'AffirmEaze',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
  },
  plugins: {
    StatusBar: {
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'ionic',
    },
  },
};

export default config;
