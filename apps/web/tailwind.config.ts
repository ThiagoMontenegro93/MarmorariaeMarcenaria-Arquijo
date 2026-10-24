import type { Config } from 'tailwindcss';

// Branding (RNF07): cores da marca em variáveis CSS, trocáveis sem rebuild de componentes.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        marca: {
          DEFAULT: 'rgb(var(--cor-marca) / <alpha-value>)',
          escura: 'rgb(var(--cor-marca-escura) / <alpha-value>)',
          clara: 'rgb(var(--cor-marca-clara) / <alpha-value>)',
        },
        pedra: 'rgb(var(--cor-pedra) / <alpha-value>)',
        whatsapp: '#25D366',
      },
      fontFamily: { sans: ['system-ui', 'Segoe UI', 'Roboto', 'sans-serif'] },
    },
  },
  plugins: [],
};

export default config;
