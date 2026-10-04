import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rebootmind.app',
  appName: 'RebootMind',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    cleartext: true,
    allowNavigation: ['*'],
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#070A10',
    },
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#070A10',
      showSpinner: false,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    LocalNotifications: {
      smallIcon: 'ic_launcher_round',
      iconColor: '#10b981',
    },
  },
};

export default config;
