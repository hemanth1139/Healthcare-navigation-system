import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0F6E7A",
          hover: "#0B545D",
          active: "#083E45",
          light: "#E6F4F3",
          "light-hover": "#D4ECE9",
        },
        urgent: {
          DEFAULT: "#E5573F",
          hover: "#C9452F",
          light: "#FDF0EE",
        },
        neutral: {
          dark: "#1E2A2E",
          mid: "#5C6B6E",
          light: "#EBF1F1",
          soft: "#F7FAFA",
        },
      },
      fontFamily: {
        heading: ["var(--font-sora)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "monospace"],
      },
      boxShadow: {
        clinical: "0 2px 12px rgba(15, 110, 122, 0.08)",
        "clinical-lg": "0 8px 24px rgba(15, 110, 122, 0.12)",
        "clinical-focus": "0 0 0 3px rgba(15, 110, 122, 0.25)",
      },
      borderRadius: {
        clinical: "16px",
        "clinical-sm": "12px",
      },
    },
  },
  plugins: [],
};

export default config;
