// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: "class",
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#8B4513",
          foreground: "#FFFFFF",
          50: '#fdf8f0',
          100: '#f9e6d4',
          200: '#f2c9a9',
          300: '#e8a87e',
          400: '#de8253',
          500: '#8B4513',
          600: '#7a3b10',
          700: '#69320d',
          800: '#58290a',
          900: '#472007',
        },
        secondary: {
          DEFAULT: "#D2B48C",
          foreground: "#3E2723",
        },
        success: {
          DEFAULT: "#2E7D32",
          foreground: "#FFFFFF",
        },
        danger: {
          DEFAULT: "#C62828",
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#FF9800",
          foreground: "#FFFFFF",
        },
        info: {
          DEFAULT: "#2196F3",
          foreground: "#FFFFFF",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config