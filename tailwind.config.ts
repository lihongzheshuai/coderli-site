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
          DEFAULT: '#0D9488',
          hover: '#0F766E',
          light: 'rgba(13, 148, 136, 0.1)',
          dark: '#14B8A6',
          'dark-hover': '#2DD4BF',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#101623',
          'elevated-light': '#FFFFFF',
          'elevated-dark': '#161F33',
        },
        subtle: {
          light: '#F1F5F9',
          dark: '#192233',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"PingFang SC"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'Monaco', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
