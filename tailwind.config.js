/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        freqBlue: '#0078D4',
        freqDark: '#0a0a0a',
        freqDarker: '#050505',
        freqGray: '#1c1c1c',
      }
    },
  },
  plugins: [],
}
