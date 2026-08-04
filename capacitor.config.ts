import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sebastian.vera',
  appName: 'Vera',
  // webDir no se usa porque cargamos la URL de Vercel directamente
  webDir: 'out',
  server: {
    // La app nativa carga Vercel — no necesita build estático
    url: 'https://vera-v1-bhxy.vercel.app',
    cleartext: false,
    androidScheme: 'https',
  },
  ios: {
    backgroundColor: '#07080a',
    contentInset: 'automatic',
  },
};

export default config;
