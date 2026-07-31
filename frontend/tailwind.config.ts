import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // PALETA CONTA CERTA - Baseada no logotipo
        primary: {
          DEFAULT: '#0d9488', // Teal Principal (verde-azulado)
          light: '#14b8a6',   // Teal Claro
          dark: '#0f766e',    // Teal Escuro
        },
        secondary: {
          DEFAULT: '#f97316', // Laranja Vibrante
          light: '#fb923c',   // Laranja Claro
          dark: '#ea580c',    // Laranja Escuro
        },
        neutral: {
          DEFAULT: '#475569', // Cinza Escuro
          light: '#64748b',   // Cinza Médio
          dark: '#334155',    // Cinza Muito Escuro
        },
        // Manter cores padrão do Tailwind como fallback
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)"],
        mono: ["var(--font-geist-mono)"],
      },
    },
  },
  plugins: [],
} satisfies Config;