import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

const config: Config = {
  darkMode: 'class',
  content: [
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: '#2dd4bf',
        ink: '#e8edf4',
        muted: '#7a8696',
        surface: '#0c1118',
        panel: '#111820',
        elevated: '#161f2a',
      },
      boxShadow: {
        glow: '0 0 20px rgba(45, 212, 191, 0.12)',
        'card': '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.02)',
        'card-hover': '0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
      },
      borderRadius: {
        card: '14px',
      },
    },
  },
  plugins: [typography],
};

export default config;
