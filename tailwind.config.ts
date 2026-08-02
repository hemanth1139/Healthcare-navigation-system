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
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
          DEFAULT: "#2563eb",
          hover: "#1d4ed8",
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
        card: "0 1px 3px rgba(0,0,0,0.08)",
        hover: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        clinical: "0 4px 20px -2px rgba(37, 99, 235, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)",
        "clinical-lg": "0 16px 36px -6px rgba(37, 99, 235, 0.16), 0 4px 12px -2px rgba(0, 0, 0, 0.06)",
        "clinical-focus": "0 0 0 4px rgba(37, 99, 235, 0.25)",
      },
      borderRadius: {
        clinical: "16px",
        "clinical-sm": "12px",
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
