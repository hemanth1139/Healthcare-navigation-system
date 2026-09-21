import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#F0FDFA",
          100: "#CCFBF1",
          200: "#99F6E4",
          300: "#5EEAD4",
          400: "#2DD4BF",
          500: "#14B8A6",
          600: "#0D9488",
          700: "#0F766E",
          800: "#115E59",
          900: "#134E4A",
          950: "#042F2E",
          DEFAULT: "#0D9488",
          hover: "#0F766E",
          foreground: "#ffffff",
        },
        surface: "#ffffff",
        background: "#f9fafb",
        foreground: "#0f172a",
        border: "#e2e8f0",
        muted: "#f1f5f9",
        "muted-foreground": "#64748b",
        success: "#22c55e",
        danger: "#ef4444",
        urgent: {
          DEFAULT: "#EF4444",
          hover: "#DC2626",
          light: "#FEF2F2",
        },
        neutral: {
          dark: "#0F172A",
          mid: "#475569",
          light: "#F1F5F9",
          soft: "#F8FAFC",
        },
      },
      fontFamily: {
        heading: ["var(--font-sora)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04)",
        hover: "0 4px 12px -2px rgba(15, 23, 42, 0.08)",
        clinical: "0 1px 2px rgba(15, 23, 42, 0.04)",
        "clinical-lg": "0 8px 24px -6px rgba(15, 23, 42, 0.12)",
        "clinical-focus": "0 0 0 4px rgba(13, 148, 136, 0.18)",
      },
      borderRadius: {
        clinical: "14px",
        "clinical-sm": "10px",
      },
      keyframes: {
        modalIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        slideIn: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        modalIn: "modalIn 0.2s ease-out forwards",
        slideIn: "slideIn 0.2s ease-out forwards",
        fadeIn: "fadeIn 0.2s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
