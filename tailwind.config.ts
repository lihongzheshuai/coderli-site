import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F766E',
          hover: '#115E59',
          light: 'rgba(15, 118, 110, 0.1)',
          dark: '#2DD4BF',
          'dark-hover': '#5EEAD4',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#090B0F',
          'elevated-light': '#FFFFFF',
          'elevated-dark': '#141923',
        },
        subtle: {
          light: '#F8FAFC',
          dark: '#0F1218',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '"IBM Plex Sans"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"PingFang SC"',
          '"Noto Sans SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
};

export default config;
