import type { Config } from "tailwindcss";

const tokens = {
  colors: {
    bg: "var(--color-bg)",
    surface: "var(--color-surface)",
    surfaceRaised: "var(--color-surface-raised)",
    border: "var(--color-border)",
    foreground: "var(--color-foreground)",
    muted: "var(--color-muted)",
    accent: "var(--color-accent)",
    accentStrong: "var(--color-accent-strong)",
    onAccent: "var(--color-on-accent)",
    success: "var(--color-success)",
    danger: "var(--color-danger)",
    warning: "var(--color-warning)",
  },
  spacing: {
    0: "var(--space-0)",
    1: "var(--space-1)",
    2: "var(--space-2)",
    3: "var(--space-3)",
    4: "var(--space-4)",
    5: "var(--space-5)",
    6: "var(--space-6)",
    8: "var(--space-8)",
    10: "var(--space-10)",
    12: "var(--space-12)",
    16: "var(--space-16)",
    20: "var(--space-20)",
    24: "var(--space-24)",
  },
  radius: {
    sm: "var(--radius-sm)",
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
    xl: "var(--radius-xl)",
    pill: "var(--radius-pill)",
  },
  shadow: {
    sm: "var(--shadow-sm)",
    md: "var(--shadow-md)",
    glow: "var(--shadow-glow)",
  },
  typography: {
    fontSans: "var(--font-sans)",
    fontDisplay: "var(--font-display)",
    sizes: {
      xs: "var(--font-size-xs)",
      sm: "var(--font-size-sm)",
      base: "var(--font-size-base)",
      lg: "var(--font-size-lg)",
      xl: "var(--font-size-xl)",
      "2xl": "var(--font-size-2xl)",
      "3xl": "var(--font-size-3xl)",
    },
  },
  layout: {
    container: "72rem",
  },
  breakpoints: {
    sm: "640px",
    md: "880px",
    lg: "1120px",
    xl: "1360px",
  },
} as const;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "./src/**/*.{md,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: tokens.colors.bg,
        surface: tokens.colors.surface,
        surfaceRaised: tokens.colors.surfaceRaised,
        border: tokens.colors.border,
        foreground: tokens.colors.foreground,
        muted: tokens.colors.muted,
        accent: tokens.colors.accent,
        accentStrong: tokens.colors.accentStrong,
        onAccent: tokens.colors.onAccent,
        success: tokens.colors.success,
        danger: tokens.colors.danger,
        warning: tokens.colors.warning,
      },
      spacing: tokens.spacing,
      borderRadius: tokens.radius,
      boxShadow: tokens.shadow,
      fontFamily: {
        sans: tokens.typography.fontSans,
        display: tokens.typography.fontDisplay,
      },
      fontSize: tokens.typography.sizes,
      maxWidth: {
        container: tokens.layout.container,
      },
      screens: tokens.breakpoints,
    },
  },
  plugins: [],
};

export default config;
