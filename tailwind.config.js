/** @type {import('tailwindcss').Config} */
const conOpacidad = (variable) => `rgb(var(${variable}) / <alpha-value>)`

export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bosque: conOpacidad('--avicola-bosque'),
        'bosque-hover': conOpacidad('--avicola-bosque-hover'),
        'bosque-50': conOpacidad('--avicola-bosque-50'),
        'bosque-100': conOpacidad('--avicola-bosque-100'),
        salvia: conOpacidad('--avicola-salvia'),
        'salvia-hover': conOpacidad('--avicola-salvia-hover'),
        'salvia-50': conOpacidad('--avicola-bosque-50'),
        'salvia-100': conOpacidad('--avicola-bosque-100'),
        crema: conOpacidad('--avicola-crema'),
        'crema-surface': conOpacidad('--avicola-crema-surface'),
        huevo: conOpacidad('--avicola-huevo'),
        'huevo-suave': conOpacidad('--avicola-huevo-suave'),
        tierra: conOpacidad('--avicola-tierra'),
        'tierra-50': conOpacidad('--avicola-crema-surface'),
        verdoso: conOpacidad('--avicola-verdoso'),
        'verdoso-muted': conOpacidad('--avicola-verdoso-muted'),
        borde: conOpacidad('--avicola-borde'),
        destructivo: conOpacidad('--avicola-destructivo'),
        'destructivo-bg': conOpacidad('--avicola-destructivo-bg'),
      },
      // Utilidades que el proyecto ya usa (nombres de Tailwind 4) y que Tailwind 3 no trae.
      boxShadow: {
        '2xs': '0 1px rgb(0 0 0 / 0.05)',
        xs: 'var(--avicola-shadow-xs, 0 1px 2px 0 rgb(0 0 0 / 0.05))',
        card: 'var(--avicola-shadow-card, 0 4px 12px -2px rgb(38 51 43 / 0.08))',
      },
      backdropBlur: {
        xs: '4px',
      },
      keyframes: {
        pensando: {
          '0%, 80%, 100%': { opacity: '0.3', transform: 'translateY(0)' },
          '40%': { opacity: '1', transform: 'translateY(-3px)' },
        },
      },
      animation: {
        pensando: 'pensando 1.2s ease-in-out infinite',
      },
      transitionDuration: {
        250: '250ms',
      },
    },
  },
  plugins: [],
}
