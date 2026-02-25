import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.5rem", // 24px
        lg: "2rem", // 32px
        xl: "2.5rem", // 40px
        "2xl": "3rem", // 48px
      },
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        // Base backgrounds / surfaces
        bg: {
          main: "var(--bg-main)",
          soft: "var(--bg-soft)",
          console: "var(--bg-console)",
          consoleDark: "var(--bg-dark-console)",
        },
        // Travel Axis
        travel: {
          300: "var(--travel-300)",
          400: "var(--travel-400)",
          500: "var(--travel-500)",
        },
        // Trust Axis
        trust: {
          500: "var(--trust-500)",
          600: "var(--trust-600)",
          700: "var(--trust-700)",
        },
        // Semantic states (fixed meaning)
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        info: "var(--info)",
        // Neutral
        ink: {
          900: "#0B1220",
          800: "#111827",
          700: "#1F2937",
          600: "#374151",
          500: "#4B5563",
          400: "#6B7280",
          300: "#9CA3AF",
          200: "#E5E7EB",
          100: "#F3F4F6",
          50: "#F9FAFB",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)", // 6px
        md: "var(--radius-md)", // 12px
        lg: "var(--radius-lg)", // 20px
        xl: "var(--radius-xl)", // 32px
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        medium: "var(--shadow-medium)",
        strong: "var(--shadow-strong)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        // Landing / Experience
        h1: ["48px", { lineHeight: "56px", letterSpacing: "-0.02em" }],
        h2: ["36px", { lineHeight: "44px", letterSpacing: "-0.02em" }],
        h3: ["28px", { lineHeight: "36px", letterSpacing: "-0.01em" }],
        h4: ["22px", { lineHeight: "30px", letterSpacing: "-0.01em" }],
        // Body
        "body-l": ["18px", { lineHeight: "28px" }],
        body: ["16px", { lineHeight: "26px" }],
        small: ["14px", { lineHeight: "22px" }],
        meta: ["12px", { lineHeight: "18px" }],
      },
      spacing: {
        // reinforce 8px grid
        18: "4.5rem", // 72
        22: "5.5rem", // 88
        30: "7.5rem", // 120
      },
      transitionDuration: {
        250: "250ms",
      },
      keyframes: {
        // Experience only (never use for escrow amounts)
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 600ms ease forwards",
      },
    },
  },
  plugins: [],
} satisfies Config;
