import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      /* ARC Design System Colors */
      colors: {
        /* Primary - Navy (Academic Blue) */
        "arc-navy": {
          950: "#071B3A",
          900: "#0B2553",
          800: "#123A73",
          700: "#164C91",
          600: "#1B5FAD",
          500: "#216FD1",
          400: "#4389DD",
          300: "#78AEE8",
          200: "#B3D0F2",
          100: "#DCEBFA",
          50: "#F2F7FD",
        },
        /* Accent - Orange (Energy/CTA) */
        "arc-orange": {
          700: "#C94700",
          600: "#E45100",
          500: "#F26522",
          400: "#FF7A35",
          300: "#FF9B66",
          200: "#FFC2A3",
          100: "#FFE4D6",
          50: "#FFF5EF",
        },
        /* Success - Green (Mastery/Progress) */
        "arc-green": {
          700: "#087A3D",
          600: "#0A9A4A",
          500: "#16B364",
          400: "#35C77A",
          300: "#70D99D",
          200: "#A8E8C3",
          100: "#D8F7E5",
          50: "#EFFBF4",
        },
        /* Practice/Assessment - Purple */
        "arc-purple": {
          700: "#5420A8",
          600: "#6B2FC1",
          500: "#7B3FD0",
          400: "#925BE0",
          300: "#B185EA",
          200: "#D0B9F4",
          100: "#EDE4FB",
          50: "#F7F3FD",
        },
        /* Alert/Danger - Red */
        "arc-red": {
          700: "#B42318",
          600: "#D92D20",
          500: "#F04438",
          400: "#F5362C",
          200: "#FECACA",
          100: "#FEE4E2",
          50: "#FEF3F2",
        },
        /* Neutral - Slate with Blue tint */
        "arc-slate": {
          950: "#0B1220",
          900: "#111827",
          800: "#1F2937",
          700: "#374151",
          600: "#4B5563",
          500: "#6B7280",
          400: "#9CA3AF",
          300: "#D1D5DB",
          200: "#E5E7EB",
          100: "#F3F4F6",
          50: "#F8FAFC",
        },
        /* Semantic Colors */
        "arc-bg": "#F6F9FC",
        "arc-surface": "#FFFFFF",
        "arc-border": "#E5E7EB",
        "arc-text": "#111827",
        "arc-muted": "#64748B",
        /* ============================================================
           SEMANTIC DESIGN TOKENS — themeable roles.
           Values are CSS vars set in globals.css :root, so the admin
           Branding settings can override them at runtime. Use these
           (bg-primary, text-success-foreground, bg-warning-subtle …)
           instead of raw arc-* steps in components and pages.
           ============================================================ */
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          foreground: "var(--primary-foreground)",
          subtle: "var(--primary-subtle)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          hover: "var(--secondary-hover)",
          foreground: "var(--secondary-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          foreground: "var(--accent-foreground)",
          subtle: "var(--accent-subtle)",
        },
        success: {
          DEFAULT: "var(--success)",
          hover: "var(--success-hover)",
          foreground: "var(--success-foreground)",
          subtle: "var(--success-subtle)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          hover: "var(--warning-hover)",
          foreground: "var(--warning-foreground)",
          subtle: "var(--warning-subtle)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          hover: "var(--danger-hover)",
          foreground: "var(--danger-foreground)",
          subtle: "var(--danger-subtle)",
        },
        /* Extended Colors */
        "arc-cyan": {
          600: "#0891B2",
          500: "#06B6D4",
          400: "#22D3EE",
          300: "#67E8F9",
          200: "#A5F3FC",
          100: "#CFFAFE",
          50: "#ECFEFF",
        },
        "arc-amber": {
          600: "#D97706",
          500: "#F59E0B",
          400: "#FBBF24",
          300: "#FCD34D",
          200: "#FDE68A",
          100: "#FEF3C7",
          50: "#FFFBEB",
        },
        "arc-pink": {
          600: "#DB2777",
          500: "#EC4899",
          400: "#F472B6",
          300: "#F9A8D4",
          200: "#FBCFE8",
          100: "#FCE7F3",
          50: "#FDF2F8",
        },
      },
      /* ARC Typography */
      fontFamily: {
        sans: ["var(--font-nunito)", "system-ui", "sans-serif"],
        heading: ["var(--font-poppins)", "system-ui", "sans-serif"],
        body: ["var(--font-nunito)", "system-ui", "sans-serif"],
      },
      /* ARC Spacing */
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
      },
      /* ARC Border Radius */
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      /* ARC Shadows */
      boxShadow: {
        "arc-sm": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "arc": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "arc-md": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        "arc-lg": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        "arc-xl": "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "arc-2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
      },
      /* ARC Animations */
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
      },
    },
  },
  plugins: [animate],
};

export default config;
