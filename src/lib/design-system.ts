// =========================================================================
// Avalon Design System
// Centralized design tokens, animation presets, and utility definitions
// =========================================================================

// ---------------------------------------------------------------------------
// Color Palette
// ---------------------------------------------------------------------------

export const colors = {
  // Base
  darkBase: "#050508",
  surface: "#0A0A10",
  surface2: "#12121C",
  surface3: "#1A1A28",
  card: "#111118",
  cardHover: "#16161f",
  border: "#1E1E2E",
  borderBright: "#2A2A40",

  // Neon Accents
  neonCyan: "#00F0FF",
  neonMagenta: "#FF00E5",
  neonGreen: "#39FF14",
  neonOrange: "#FF6B00",
  neonPurple: "#B026FF",
  neonRed: "#FF1744",
  neonYellow: "#FFE600",

  // Brand
  avalanche: "#e84142",
  gold: "#f59e0b",

  // UI
  accent: "#818cf8",
  accentHover: "#6366f1",
  primary: "#00F0FF",
  primaryDim: "#00A8B3",
  secondary: "#FF00E5",
  secondaryDim: "#B300A0",

  // Status
  success: "#39FF14",
  warning: "#FFE600",
  danger: "#FF1744",
  info: "#00F0FF",

  // Rarity
  rarityCommon: "#9CA3AF",
  rarityUncommon: "#22C55E",
  rarityRare: "#3B82F6",
  rarityEpic: "#A855F7",
  rarityLegendary: "#F59E0B",
} as const;

// ---------------------------------------------------------------------------
// Glow Effects (for inline styles or Tailwind arbitrary values)
// ---------------------------------------------------------------------------

export const glows = {
  textCyan: "0 0 10px #00F0FF, 0 0 20px #00F0FF80, 0 0 40px #00F0FF40",
  textRed: "0 0 10px #e84142, 0 0 20px #e8414280, 0 0 40px #e8414240",
  textPurple: "0 0 10px #B026FF, 0 0 20px #B026FF80, 0 0 40px #B026FF40",
  textGreen: "0 0 10px #39FF14, 0 0 20px #39FF1480, 0 0 40px #39FF1440",
  textGold: "0 0 10px #f59e0b, 0 0 20px #f59e0b80, 0 0 40px #f59e0b40",
  textMagenta: "0 0 10px #FF00E5, 0 0 20px #FF00E580, 0 0 40px #FF00E540",

  borderCyan: "0 0 5px #00F0FF, 0 0 10px #00F0FF40, inset 0 0 5px #00F0FF20",
  borderRed: "0 0 5px #e84142, 0 0 10px #e8414240, inset 0 0 5px #e8414220",
  borderPurple: "0 0 5px #B026FF, 0 0 10px #B026FF40, inset 0 0 5px #B026FF20",
  borderGreen: "0 0 5px #39FF14, 0 0 10px #39FF1440, inset 0 0 5px #39FF1420",

  boxCyan: "0 0 15px #00F0FF, 0 0 30px #00F0FF40, 0 0 60px #00F0FF20",
  boxRed: "0 0 15px #e84142, 0 0 30px #e8414240, 0 0 60px #e8414220",
  boxPurple: "0 0 15px #B026FF, 0 0 30px #B026FF40, 0 0 60px #B026FF20",
} as const;

// ---------------------------------------------------------------------------
// Gradient Presets
// ---------------------------------------------------------------------------

export const gradients = {
  hero: "radial-gradient(ellipse at top, #1a0a2e 0%, #0a0a10 40%, #050508 100%)",
  card: "linear-gradient(135deg, #0f0f18 0%, #151520 100%)",
  button: "linear-gradient(135deg, #e84142 0%, #B026FF 100%)",
  buttonHover: "linear-gradient(135deg, #f05252 0%, #c040ff 100%)",
  cyanPurple: "linear-gradient(135deg, #00F0FF 0%, #B026FF 100%)",
  redOrange: "linear-gradient(135deg, #e84142 0%, #FF6B00 100%)",
  greenCyan: "linear-gradient(135deg, #39FF14 0%, #00F0FF 100%)",
  mesh: `radial-gradient(at 20% 20%, #B026FF15 0%, transparent 50%),
    radial-gradient(at 80% 80%, #00F0FF15 0%, transparent 50%),
    radial-gradient(at 50% 50%, #e8414210 0%, transparent 50%),
    #050508`,
  textShine: "linear-gradient(90deg, #00F0FF, #B026FF, #FF00E5, #00F0FF)",
} as const;

// ---------------------------------------------------------------------------
// Framer Motion Animation Presets
// ---------------------------------------------------------------------------

export const animations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.5 },
  },
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  },
  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  },
  slideUp: {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
  slideDown: {
    initial: { opacity: 0, y: -40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
  slideLeft: {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
  slideRight: {
    initial: { opacity: 0, x: -40 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
  pulseGlow: {
    animate: {
      boxShadow: [
        "0 0 5px rgba(0, 240, 255, 0.15), 0 0 15px rgba(0, 240, 255, 0.1)",
        "0 0 10px rgba(0, 240, 255, 0.3), 0 0 30px rgba(0, 240, 255, 0.2), 0 0 60px rgba(0, 240, 255, 0.1)",
        "0 0 5px rgba(0, 240, 255, 0.15), 0 0 15px rgba(0, 240, 255, 0.1)",
      ],
    },
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  },
  staggerContainer: {
    animate: { transition: { staggerChildren: 0.1 } },
  },
  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  },
  hover: {
    scale: 1.02,
    transition: { type: "spring", stiffness: 400, damping: 17 },
  },
  tap: {
    scale: 0.98,
  },
} as const;

// ---------------------------------------------------------------------------
// Spacing & Layout Tokens
// ---------------------------------------------------------------------------

export const layout = {
  maxWidth: "1280px",
  navHeight: "4rem",
  sectionPadding: "6rem",
  cardRadius: "0.75rem",
  buttonRadius: "0.625rem",
} as const;
