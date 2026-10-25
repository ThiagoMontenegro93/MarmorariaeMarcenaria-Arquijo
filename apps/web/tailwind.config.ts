import type { Config } from 'tailwindcss';

// Branding (RNF07): cores em variáveis CSS (madeira + pedra), trocáveis sem mexer nos componentes.
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
        fundo: 'rgb(var(--cor-fundo) / <alpha-value>)',
        superficie: 'rgb(var(--cor-superficie) / <alpha-value>)',
        linha: 'rgb(var(--cor-linha) / <alpha-value>)',
        grafite: 'rgb(var(--cor-grafite) / <alpha-value>)',
        whatsapp: '#17824a',
        prioridade: { baixa: '#8a8984', normal: '#2f6fb5', alta: '#dd7419', emergencial: '#c62828' },
      },
      fontFamily: {
        sans: ['"Public Sans"', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
