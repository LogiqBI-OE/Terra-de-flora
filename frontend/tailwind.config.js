/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        oleo: {
          green: '#A8D060',
          'green-dark': '#8AB348',
          bg: '#0B0F08',
          'bg-2': '#131A0F',
        },
      },
    },
  },
  plugins: [],
}
