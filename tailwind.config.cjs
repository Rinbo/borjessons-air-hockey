/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: ({ colors }) => ({
        primary: colors.slate[700],
        bg: colors.slate[200]
      }),
      animation: {
        'spin-slow': 'spin 1s linear infinite'
      }
    }
  },
  plugins: []
};
