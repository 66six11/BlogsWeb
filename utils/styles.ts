/**
 * Theme Styles Utility Module
 * 
 * This module provides semantic style definitions that use CSS variables from theme.css.
 * Components should import styles from this module instead of using hardcoded Tailwind
 * color classes or direct var(--xxx) CSS variable references.
 * 
 * This enables centralized theme management and easy color adjustments.
 */

// =================================================================================
// BACKGROUND STYLES
// =================================================================================

export const bgStyles = {
  /** Primary background - deepest level (e.g., page background) */
  primary: { backgroundColor: 'var(--bg-primary)' },
  /** Secondary background - cards, panels */
  secondary: { backgroundColor: 'var(--bg-secondary)' },
  /** Tertiary background - nested elements, borders */
  tertiary: { backgroundColor: 'var(--bg-tertiary)' },
  /** Transparent with primary tint */
  primaryTranslucent: { backgroundColor: 'rgba(var(--bg-primary-rgb, 15, 23, 42), 0.8)' },
  /** Transparent with secondary tint */
  secondaryTranslucent: { backgroundColor: 'rgba(var(--bg-secondary-rgb, 30, 41, 59), 0.5)' },
};

// =================================================================================
// TEXT STYLES
// =================================================================================

export const textStyles = {
  /** Primary text color - headings, important text */
  primary: { color: 'var(--text-primary)' },
  /** Secondary text color - body text, descriptions */
  secondary: { color: 'var(--text-secondary)' },
  /** Accent colors for emphasis */
  accent1: { color: 'var(--accent-1)' },
  accent2: { color: 'var(--accent-2)' },
  accent3: { color: 'var(--accent-3)' },
};

// =================================================================================
// BORDER STYLES
// =================================================================================

export const borderStyles = {
  /** Subtle border using tertiary background */
  subtle: { borderColor: 'var(--bg-tertiary)' },
  /** Accent borders */
  accent1: { borderColor: 'var(--accent-1)' },
  accent2: { borderColor: 'var(--accent-2)' },
  accent3: { borderColor: 'var(--accent-3)' },
};

// =================================================================================
// COMBINED COMPONENT STYLES
// =================================================================================

/** Card container styles */
export const cardStyles = {
  /** Primary card - main content containers */
  primary: {
    backgroundColor: 'var(--bg-secondary)',
    borderColor: 'var(--bg-tertiary)',
    borderWidth: '1px',
    borderStyle: 'solid',
  },
  /** Secondary card - nested or less prominent */
  secondary: {
    backgroundColor: 'var(--bg-primary)',
    borderColor: 'var(--bg-tertiary)',
    borderWidth: '1px',
    borderStyle: 'solid',
  },
};

/** Button styles */
export const buttonStyles = {
  /** Primary button - main actions */
  primary: {
    backgroundColor: 'var(--accent-3)',
    color: 'white',
  },
  /** Secondary button - alternative actions */
  secondary: {
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-secondary)',
    borderColor: 'var(--bg-tertiary)',
    borderWidth: '1px',
    borderStyle: 'solid',
  },
  /** Ghost button - minimal styling */
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
  },
  /** Active/Playing state */
  active: {
    backgroundColor: 'var(--accent-1)',
    color: 'white',
  },
};

/** Input styles */
export const inputStyles = {
  /** Default input field */
  default: {
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    borderColor: 'var(--bg-tertiary)',
    borderWidth: '1px',
    borderStyle: 'solid',
  },
};

/** Panel/Modal styles */
export const panelStyles = {
  /** Dropdown/popup panel */
  dropdown: {
    backgroundColor: 'var(--bg-primary)',
    borderColor: 'var(--bg-tertiary)',
    borderWidth: '1px',
    borderStyle: 'solid',
  },
  /** Header/toolbar area */
  header: {
    backgroundColor: 'var(--bg-secondary)',
    borderColor: 'var(--bg-tertiary)',
  },
};

// =================================================================================
// GRADIENT HELPERS
// =================================================================================

export const gradientStyles = {
  /** Gradient using accent colors */
  accentGradient: {
    background: 'linear-gradient(to right, var(--accent-3), var(--bg-tertiary))',
  },
  /** Button gradient */
  buttonGradient: {
    background: 'linear-gradient(to bottom right, var(--accent-3), var(--accent-2))',
  },
};

// =================================================================================
// TAILWIND CLASS COMBINATIONS (for className attribute)
// =================================================================================

/**
 * Semantic Tailwind class combinations for common UI patterns.
 * These use the custom theme classes defined in tailwind.config.
 */
export const themeClasses = {
  // Backgrounds
  bgPrimary: 'bg-theme-primary',
  bgSecondary: 'bg-theme-secondary',
  bgTertiary: 'bg-theme-tertiary',
  
  // Text
  textPrimary: 'text-theme-text-primary',
  textSecondary: 'text-theme-text-secondary',
  
  // Accents
  accent1: 'text-theme-accent-1',
  accent2: 'text-theme-accent-2',
  accent3: 'text-theme-accent-3',
  bgAccent1: 'bg-theme-accent-1',
  bgAccent2: 'bg-theme-accent-2',
  bgAccent3: 'bg-theme-accent-3',
  
  // Borders
  borderSubtle: 'border-theme-tertiary',
  borderAccent1: 'border-theme-accent-1',
  borderAccent3: 'border-theme-accent-3',
  
  // Common component patterns
  card: 'bg-theme-secondary border border-theme-tertiary',
  cardPrimary: 'bg-theme-primary border border-theme-tertiary',
  panel: 'bg-theme-primary border border-theme-tertiary backdrop-blur-md',
  button: 'bg-theme-accent-3 text-white hover:opacity-90',
  buttonSecondary: 'bg-theme-secondary text-theme-text-secondary border border-theme-tertiary hover:bg-white/10',
  input: 'bg-theme-secondary text-theme-text-primary border border-theme-tertiary',
};

// =================================================================================
// HELPER FUNCTIONS
// =================================================================================

/**
 * Merge multiple style objects into one
 */
export function mergeStyles(...styles: (React.CSSProperties | undefined)[]): React.CSSProperties {
  return Object.assign({}, ...styles.filter(Boolean));
}

/**
 * Create a style object with CSS variable value
 */
export function cssVar(name: string, fallback?: string): string {
  return fallback ? `var(${name}, ${fallback})` : `var(${name})`;
}
