import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aquarium.premium',
  appName: 'Aqualis',
  webDir: 'dist',
  server: {
    // https scheme is required for BrowserRouter + localStorage + Web APIs
    androidScheme: 'https',
  },
};

export default config;
