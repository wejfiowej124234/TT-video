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
          600: "var(--travel-600)",
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
        /** 85/86 TravelTrust Experience 暖纸色（仅叙事区） */
        tt: {
          ink: {
            deep: "var(--tt-ink-deep)",
            DEFAULT: "var(--tt-ink)",
            muted: "var(--tt-ink-muted)",
            contrast: "var(--tt-ink-contrast)",
          },
          canvas: {
            DEFAULT: "var(--tt-canvas)",
            bleach: "var(--tt-canvas-bleach)",
          },
          brown: {
            750: "var(--tt-brown-750)",
            800: "var(--tt-brown-800)",
            900: "var(--tt-brown-900)",
          },
          sand: "var(--tt-sand)",
        },
        /** 参考色板 Tropical jade sunrise（体验层点缀；与 22 主色并存，用于玻璃态/渐变高光） */
        ref: {
          coral: "var(--ref-coral)",
          cyan: "var(--ref-cyan)",
          sun: "var(--ref-sun)",
          sage: "var(--ref-sage)",
          teal: "var(--ref-teal)",
        },
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
        "scifi-panel": "var(--shadow-scifi-panel)",
        "scifi-panel-md": "var(--shadow-scifi-panel-md)",
        "scifi-banner": "var(--shadow-scifi-banner)",
        "scifi-banner-strong": "var(--shadow-scifi-banner-strong)",
        "scifi-modal": "var(--shadow-scifi-modal)",
        "scifi-modal-inner": "var(--shadow-scifi-modal-inner)",
        "scifi-sheet": "var(--shadow-scifi-sheet)",
        "scifi-glow": "var(--shadow-scifi-glow)",
        "scifi-step": "var(--shadow-scifi-step)",
        "scifi-toast": "var(--shadow-scifi-toast)",
        "scifi-fuchsia-panel": "var(--shadow-scifi-fuchsia-panel)",
        "scifi-fuchsia-panel-md": "var(--shadow-scifi-fuchsia-panel-md)",
        "scifi-fuchsia-fab": "var(--shadow-scifi-fuchsia-fab)",
        "scifi-fuchsia-cta": "var(--shadow-scifi-fuchsia-cta)",
        "scifi-dropdown": "var(--shadow-scifi-dropdown)",
        "warm-up": "var(--shadow-warm-up)",
        "warm-nav": "var(--shadow-warm-nav)",
        "warm-card": "var(--shadow-warm-card)",
        "warm-card-muted": "var(--shadow-warm-card-muted)",
        "warm-hero": "var(--shadow-warm-hero)",
        "warm-deep": "var(--shadow-warm-deep)",
        "warm-skeleton": "var(--shadow-warm-skeleton)",
        "warm-accordion": "var(--shadow-warm-accordion)",
        "warm-cta": "var(--shadow-warm-cta)",
        "warm-stat": "var(--shadow-warm-stat)",
        "warm-darkcard": "var(--shadow-warm-darkcard)",
        "scifi-hover": "var(--shadow-scifi-hover)",
        "scifi-hover-soft": "var(--shadow-scifi-hover-soft)",
        "scifi-hover-strong": "var(--shadow-scifi-hover-strong)",
        "scifi-fuchsia-hover": "var(--shadow-scifi-fuchsia-hover)",
        "scifi-fuchsia-glow-sm": "var(--shadow-scifi-fuchsia-glow-sm)",
        "scifi-bi-banner": "var(--shadow-scifi-bi-banner)",
        "scifi-success": "var(--shadow-scifi-success)",
        "scifi-fuchsia-prominent": "var(--shadow-scifi-fuchsia-prominent)",
        "scifi-fuchsia-prominent-hover": "var(--shadow-scifi-fuchsia-prominent-hover)",
        "rank-gold": "var(--shadow-rank-gold)",
        "rank-gold-hover": "var(--shadow-rank-gold-hover)",
        "scifi-modal-tint": "var(--shadow-scifi-modal-tint)",
        "scifi-fuchsia-modal": "var(--shadow-scifi-fuchsia-modal)",
        "scifi-login": "var(--shadow-scifi-login)",
        "scifi-dot-glow": "var(--shadow-scifi-dot-glow)",
        "scifi-card-faint": "var(--shadow-scifi-card-faint)",
        "scifi-card-faint-hover": "var(--shadow-scifi-card-faint-hover)",
        "scifi-masonry-hover": "var(--shadow-scifi-masonry-hover)",
        "rank-section": "var(--shadow-rank-section)",
        "scifi-panel-lo": "var(--shadow-scifi-panel-lo)",
      },
      dropShadow: {
        "scifi-cyan-muted": "var(--drop-scifi-cyan-muted)",
        "scifi-cyan": "var(--drop-scifi-cyan)",
        "scifi-cyan-title": "var(--drop-scifi-cyan-title)",
        "scifi-cyan-lg": "var(--drop-scifi-cyan-lg)",
        "scifi-cyan-link": "var(--drop-scifi-cyan-link)",
        "scifi-cyan-strong": "var(--drop-scifi-cyan-strong)",
        "scifi-fuchsia": "var(--drop-scifi-fuchsia)",
        "scifi-fuchsia-soft": "var(--drop-scifi-fuchsia-soft)",
        "stat-success": "var(--drop-stat-success)",
        "stat-warning": "var(--drop-stat-warning)",
        "stat-slate": "var(--drop-stat-slate)",
        "rank-gold": "var(--drop-rank-gold)",
        "rank-gold-soft": "var(--drop-rank-gold-soft)",
        "market-hero": "var(--drop-market-hero)",
        "market-body": "var(--drop-market-body)",
        "market-pill": "var(--drop-market-pill)",
        "market-section": "var(--drop-market-section)",
        "landing-hero": "var(--drop-landing-hero)",
        "on-dark": "var(--drop-on-dark)",
      },
      backgroundImage: {
        /** 22 §一点五 · 86 Experience 主 CTA（非 Escrow 签名/扣款区） */
        "cta-gradient":
          "linear-gradient(135deg, var(--cta-gradient-start) 0%, var(--cta-gradient-end) 100%)",
        /** 22 §2.1 旅游情绪辅助渐变 */
        "travel-hero":
          "linear-gradient(135deg, var(--travel-500) 0%, var(--travel-accent-teal) 100%)",
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
        /** 22 补充：TravelTrust kicker / 密集徽标（10–11px） */
        kicker: ["11px", { lineHeight: "14px" }],
        micro: ["10px", { lineHeight: "14px" }],
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
        // 28 Web3 微元素：badge 淡入 200ms
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        traveltrustShimmer: {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(320%)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 600ms ease forwards",
        fadeIn: "fadeIn 200ms ease forwards",
        "traveltrust-shimmer": "traveltrustShimmer 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
