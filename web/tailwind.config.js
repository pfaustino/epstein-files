/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#090a0f',
          800: '#12141c',
          700: '#1c1f2e',
          600: '#272b3f',
        }
      }
    },
  },
  plugins: [],
}
