/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Habilita el modo oscuro basado en clases
  theme: {
    extend: {
      colors: {
        // Puedes definir colores corporativos base si lo deseas
        brand: {
          green: '#10b981', // Verde esmeralda
          dark: '#09090b',  // Negro/Zinc
          light: '#ffffff'  // Blanco
        }
      }
    },
  },
  plugins: [],
}