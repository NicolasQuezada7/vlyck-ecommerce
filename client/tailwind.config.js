/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#0df2a6", // Turquesa base
        "vlyck-lime": "#A7FF2D", // El verde neón del inicio del rayo
        "vlyck-cyan": "#2DFFFF", // El cyan del final del rayo
        "background-dark": "#050505", // Negro profundo
        "card-dark": "#111111",
      },
      fontFamily: {
        "sans": ["Space Grotesk", "sans-serif"],
        "display": ["Space Grotesk", "sans-serif"],
      },
      backgroundImage: {
        'vlyck-gradient': 'linear-gradient(90deg, #A7FF2D, #0df2a6, #2DFFFF)',
      }
    },
  },
  plugins: [],
}