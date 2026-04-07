import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy:        "#1a1a2e",
          gold:        "#8B7536",
          "gold-light": "#c9b97a",
          muted:       "#4a4a6a",
        },
        primary: {
          50:  "#fdf8ee",
          100: "#f7edcc",
          200: "#eed89a",
          300: "#e3be60",
          400: "#c9b97a",
          500: "#8B7536",
          600: "#7a6530",
          700: "#5e4d24",
          800: "#42361a",
          900: "#2a2110",
          950: "#1a1a2e",
        },
      },
    },
  },
  safelist: ["bg-white", "min-h-screen", "bg-blue-600", "text-white", "rounded-2xl"],
  plugins: [],
};

export default config;
