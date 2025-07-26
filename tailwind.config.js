/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./nuxt.config.{js,ts}",
    "./app.vue",
  ],
  theme: {
    extend: {
      colors: {
        // Saturnator Color Palette
        saturnator: {
          // Primary Blues
          'blue-light': '#1FBAFF',
          'blue-medium': '#3686FF',
          'blue-dark': '#1FADED',
          'blue-darker': '#248DDA',
          
          // Purple Accents
          'purple-light': '#7F8CFF',
          'purple-medium': '#A07ACC',
          'purple-dark': '#A96BB4',
          'purple-custom': '#A07ACC',
          
          // Accent Red
          'red': '#ED1C24',
          
          // Neutral colors for UI
          'gray-light': '#F8F9FA',
          'gray-medium': '#6C757D',
          'gray-dark': '#343A40',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} 