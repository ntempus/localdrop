import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#34d399", // emerald-400
        "primary-hover": "#6ee7b7", // emerald-300
        "background-dark": "#161616",
        "surface-dark": "#202020",
        "border-dark": "#2e2e2e",
        "text-primary-dark": "#e5e5e5",
        "text-secondary-dark": "#a3a3a3",
        "text-tertiary-dark": "#737373",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        full: "9999px",
      },
      boxShadow: {
        glow: "0 0 15px 5px rgba(52, 211, 153, 0.1)",
      },
    },
  },
  plugins: [],
};
export default config;

