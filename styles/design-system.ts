/**
 * Design System - Design Tokens & Style Utilities
 * Centralized styling for consistent UI across the POS Resto application
 */

// =============================================================================
// COLOR TOKENS
// =============================================================================

export const colors = {
  // Primary
  primary: {
    50: "slate-50",
    100: "slate-100",
    200: "slate-200",
    500: "slate-500",
    600: "slate-600",
    700: "slate-700",
    800: "slate-800",
    900: "slate-900",
  },
  // Success
  success: {
    50: "emerald-50",
    100: "emerald-100",
    500: "emerald-500",
    600: "emerald-600",
    700: "emerald-700",
  },
  // Warning
  warning: {
    50: "amber-50",
    100: "amber-100",
    500: "amber-500",
    600: "amber-600",
  },
  // Danger
  danger: {
    50: "rose-50",
    100: "rose-100",
    500: "rose-500",
    600: "rose-600",
  },
  // Info
  info: {
    50: "blue-50",
    100: "blue-100",
    500: "blue-500",
    600: "blue-600",
  },
  // Neutral
  neutral: {
    50: "gray-50",
    100: "gray-100",
    200: "gray-200",
    300: "gray-300",
    400: "gray-400",
    500: "gray-500",
  },
} as const;

// =============================================================================
// SPACING TOKENS
// =============================================================================

export const spacing = {
  xs: "1", // 4px
  sm: "2", // 8px
  md: "3", // 12px
  lg: "4", // 16px
  xl: "6", // 24px
  "2xl": "8", // 32px
} as const;

// =============================================================================
// BORDER RADIUS TOKENS
// =============================================================================

export const radius = {
  sm: "rounded-lg",
  md: "rounded-xl",
  lg: "rounded-2xl",
  xl: "rounded-3xl",
  "2xl": "rounded-[32px]",
  "3xl": "rounded-[40px]",
  full: "rounded-full",
} as const;

// =============================================================================
// SHADOW TOKENS
// =============================================================================

export const shadows = {
  none: "shadow-none",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl",
  "2xl": "shadow-2xl",
} as const;

// =============================================================================
// TYPOGRAPHY TOKENS
// =============================================================================

export const typography = {
  // Headings
  h1: "text-2xl font-black tracking-tight",
  h2: "text-xl font-bold",
  h3: "text-lg font-bold",
  h4: "text-sm font-bold",

  // Body
  body: "text-sm font-medium",
  bodySmall: "text-xs font-medium",

  // Labels
  label: "text-[10px] font-black uppercase tracking-widest",
  labelSmall: "text-[9px] font-bold uppercase tracking-wider",

  // Caption
  caption: "text-[10px] text-gray-400 font-bold uppercase tracking-widest",
} as const;

// =============================================================================
// BUTTON STYLES
// =============================================================================

type ButtonVariant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "ghost";
type ButtonSize = "sm" | "md" | "lg";

export const buttonStyles = {
  base: "inline-flex items-center justify-center gap-2 font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed",

  variants: {
    primary:
      "bg-slate-900 text-white hover:bg-slate-800 active:scale-95 shadow-lg",
    secondary:
      "bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-100",
    success:
      "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-100",
    danger:
      "bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-100",
    warning:
      "bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-100",
    ghost: "bg-transparent text-gray-400 hover:bg-gray-50 hover:text-gray-600",
  },

  sizes: {
    sm: "px-3 py-2 text-[9px] rounded-xl",
    md: "px-4 py-3 text-[10px] rounded-2xl",
    lg: "px-6 py-4 text-xs rounded-2xl",
  },
} as const;

export const getButtonClasses = (
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  fullWidth = false
): string => {
  return [
    buttonStyles.base,
    buttonStyles.variants[variant],
    buttonStyles.sizes[size],
    fullWidth ? "w-full" : "",
  ]
    .filter(Boolean)
    .join(" ");
};

// =============================================================================
// CARD STYLES
// =============================================================================

type CardVariant = "default" | "bordered" | "elevated";

export const cardStyles = {
  base: "bg-white",

  variants: {
    default: "rounded-[32px] border border-gray-100 shadow-sm",
    bordered: "rounded-2xl border border-gray-200",
    elevated: "rounded-[40px] shadow-xl border border-gray-50",
  },

  padding: {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  },
} as const;

export const getCardClasses = (
  variant: CardVariant = "default",
  padding: "sm" | "md" | "lg" = "md"
): string => {
  return [
    cardStyles.base,
    cardStyles.variants[variant],
    cardStyles.padding[padding],
  ].join(" ");
};

// =============================================================================
// INPUT STYLES
// =============================================================================

export const inputStyles = {
  base: "w-full bg-gray-50 border border-transparent rounded-2xl py-3 px-4 text-sm font-medium outline-none transition-all",
  focus: "focus:bg-white focus:ring-2 focus:ring-slate-900",
  error: "border-rose-300 focus:ring-rose-500",
  disabled: "opacity-50 cursor-not-allowed",
} as const;

export const getInputClasses = (hasError = false, disabled = false): string => {
  return [
    inputStyles.base,
    inputStyles.focus,
    hasError ? inputStyles.error : "",
    disabled ? inputStyles.disabled : "",
  ]
    .filter(Boolean)
    .join(" ");
};

// =============================================================================
// BADGE STYLES
// =============================================================================

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

export const badgeStyles = {
  base: "inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider",

  variants: {
    default: "bg-slate-100 text-slate-500",
    success: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    warning: "bg-amber-50 text-amber-600 border border-amber-100",
    danger: "bg-rose-50 text-rose-600 border border-rose-200",
    info: "bg-blue-50 text-blue-600 border border-blue-100",
  },
} as const;

export const getBadgeClasses = (variant: BadgeVariant = "default"): string => {
  return [badgeStyles.base, badgeStyles.variants[variant]].join(" ");
};

// =============================================================================
// TABLE STYLES
// =============================================================================

export const tableStyles = {
  container:
    "bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden",
  header:
    "bg-gray-50/50 text-gray-400 text-[10px] uppercase tracking-widest font-black",
  headerCell: "px-6 py-5",
  row: "hover:bg-gray-50/30 transition-colors",
  cell: "px-6 py-4",
  divider: "divide-y divide-gray-50",
} as const;

// =============================================================================
// ICON BUTTON STYLES
// =============================================================================

export const iconButtonStyles = {
  base: "p-2 rounded-xl transition-all",
  variants: {
    default: "text-gray-400 hover:bg-gray-50 hover:text-gray-600",
    primary: "text-gray-400 hover:bg-slate-100 hover:text-slate-900",
    success: "text-gray-400 hover:bg-emerald-50 hover:text-emerald-600",
    danger: "text-gray-400 hover:bg-rose-50 hover:text-rose-600",
    info: "text-gray-400 hover:bg-blue-50 hover:text-blue-600",
  },
} as const;

export const getIconButtonClasses = (
  variant: keyof typeof iconButtonStyles.variants = "default"
): string => {
  return [iconButtonStyles.base, iconButtonStyles.variants[variant]].join(" ");
};

// =============================================================================
// ANIMATION CLASSES
// =============================================================================

export const animations = {
  fadeIn: "animate-in fade-in duration-500",
  slideUp: "animate-in slide-in-from-bottom-4 duration-500",
  slideRight: "animate-in slide-in-from-right-8 duration-500",
  zoomIn: "animate-in zoom-in-95 duration-500",
} as const;

// =============================================================================
// PAGE LAYOUT STYLES
// =============================================================================

export const pageStyles = {
  container:
    "flex-1 bg-gray-50 h-screen overflow-y-auto custom-scroll p-4 lg:p-8 pb-24 md:pb-8",
  header:
    "mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4",
} as const;

// =============================================================================
// MODAL STYLES
// =============================================================================

export const modalStyles = {
  overlay:
    "fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm",
  container:
    "bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden",
  header: "p-6 border-b border-gray-50 flex items-center justify-between",
  body: "p-8",
  footer: "p-6 bg-gray-50/80 border-t border-gray-100 flex gap-3",
} as const;
