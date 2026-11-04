/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bosque: '#244B36',
        'bosque-hover': '#1b3829',
        'bosque-50': '#f2f7f4',
        'bosque-100': '#e2ede7',
        salvia: '#6F9678',
        'salvia-hover': '#587a60',
        'salvia-50': '#f4f7f5',
        'salvia-100': '#e5ece7',
        crema: '#F5F3EA',
        huevo: '#D9A441',
        'huevo-suave': '#FFF1CC',
        tierra: '#8B6548',
        'tierra-50': '#fbf8f5',
        verdoso: '#26332B',
        'verdoso-muted': '#526359',
        borde: '#E4E7DF',
      },
    },
  },
  plugins: [],
}
