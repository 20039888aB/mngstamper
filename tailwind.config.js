/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.025em',
      },
      boxShadow: {
        // Soft, layered elevation for a premium feel in both themes.
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 4px 12px -2px rgb(15 23 42 / 0.06)',
        'card-hover':
          '0 2px 4px 0 rgb(15 23 42 / 0.05), 0 12px 28px -6px rgb(15 23 42 / 0.12)',
        lift: '0 16px 40px -12px rgb(15 23 42 / 0.25)',
        glow: '0 0 0 1px rgb(37 99 235 / 0.15), 0 8px 30px -6px rgb(37 99 235 / 0.45)',
        'header-scrolled': '0 1px 0 0 rgb(15 23 42 / 0.06), 0 8px 24px -16px rgb(15 23 42 / 0.24)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
        'brand-gradient-soft': 'linear-gradient(135deg, rgb(37 99 235 / 0.14) 0%, rgb(30 64 175 / 0.10) 100%)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out both',
        'fade-in-up': 'fade-in-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'scale-in': 'scale-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
}
