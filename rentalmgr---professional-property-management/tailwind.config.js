/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
    "./index.tsx"
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#137fec",
        "primary-dark": "#0b5ed7",
        "background-light": "#f3f4f6",
        "background-dark": "#101922",
        "surface-light": "#ffffff",
        "surface-dark": "#1e293b",
        "text-primary": "#1f2937",
        "text-secondary": "#6b7280",
      },
      fontFamily: {
        "sans": ["Manrope", "sans-serif"]
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}
