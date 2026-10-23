/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0B0C10',
          surface: '#13151B',
          elevated: '#1A1E28',
          gold: '#E6AF5D',
          'gold-light': '#F5CF8E',
          'gold-dark': '#B8832A',
          coral: '#FF6347',
          emerald: '#10B981',
          sky: '#38BDF8'
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif']
      },
      boxShadow: {
        glow: '0 0 25px rgba(230, 175, 93, 0.2)',
        'glow-lg': '0 0 35px rgba(230, 175, 93, 0.35)'
      }
    },
  },
  plugins: [],
}
