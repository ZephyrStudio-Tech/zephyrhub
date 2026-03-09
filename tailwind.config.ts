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
        background: "var(--background)",
        foreground: "var(--foreground)",
        accent: "var(--accent)",
        muted: "var(--muted)",
        primary: {
          DEFAULT: "#364dff",
          light: "#5a6eff",
          dark: "#2b3ecc",
          gradient: "#667aff",
        },
        surface: "#F8F9FF",
        dark: {
          bg: "#0F172A",
          surface: "#1E293B",
          text: "#F1F5F9",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(54, 77, 255, 0.25)",
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
