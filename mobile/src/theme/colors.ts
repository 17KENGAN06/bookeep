export type ThemeMode = 'light' | 'dark';

export type AppColors = {
  bg: string;
  surface: string;
  surface2: string;
  ink: string;
  muted: string;
  line: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  error: string;
  placeholder: string;
};

export const palettes: Record<ThemeMode, AppColors> = {
  light: {
    bg: '#F7FAF8',
    surface: '#FFFFFF',
    surface2: '#E6F0EB',
    ink: '#1F3D32',
    muted: '#667A72',
    line: '#D7E2DC',
    accent: '#2E7D66',
    accentSoft: '#E6EEE9',
    onAccent: '#F7FAF8',
    error: '#9A3B2F',
    placeholder: '#8A9A94',
  },
  dark: {
    bg: '#081F19',
    surface: '#0D2720',
    surface2: '#122E26',
    ink: '#E6FAF1',
    muted: '#91ADA2',
    line: '#1E3F35',
    accent: '#3CD6A0',
    accentSoft: '#17382E',
    onAccent: '#081F19',
    error: '#F0A090',
    placeholder: '#6F8B82',
  },
};
