/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      colors: {
        'vibe-orange': '#FF6347',
        'linkedin-blue': '#0A66C2',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 99, 71, 0.5)' },
          '50%': { boxShadow: '0 0 0 8px rgba(255, 99, 71, 0)' },
        },
      },
    },
  },
  plugins: [],
};
