/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0d1117',
        foreground: '#c9d1d9',
        card: '#161b22',
        border: '#30363d',
        primary: '#58a6ff',
        success: '#26a69a',
        danger: '#ef5350',
        warning: '#d29922',
      },
    },
  },
  plugins: [],
}
