// =================================================================================
// THEME CONFIGURATION
// Centralized theme settings for light and dark modes
// =================================================================================

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  // Main background colors (gradients from lighter to darker)
  primary: string;
  secondary: string;
  tertiary: string;
  
  // Accent/highlight colors
  accent1: string;
  accent2: string;
  accent3: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  
  // Border colors
  border: string;
  borderHover: string;
  
  // Overlay colors
  overlay: string;
  overlayHeavy: string;
}

export interface IconColors {
  // CustomSparkleIcon colors
  sparkleMain: string;      // Main star pattern
  sparkleGem: string;       // Gem/crystal accent
  sparkleHighlight: string; // Highlight points
  
  // CustomWitchIcon colors (uses same color scheme)
  witchMain: string;
  witchGem: string;
  witchHighlight: string;
  
  // HexagramIcon colors
  hexagramPrimary: string;
  hexagramSecondary: string;
}

export interface ParticleColors {
  primary: string;
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  icons: IconColors;
  particles: ParticleColors;
}

// =================================================================================
// DARK THEME
// Main colors (from darkest to lightest): #3b3442, #4d4658, #897b8c
// Accent colors: #deb99a (gold), #c493b1 (rose), #7C85EB (purple-blue)
// =================================================================================
export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    // Main background colors (dark to light gradient)
    primary: '#3b3442',     // Darkest - base background, primary surfaces
    secondary: '#4d4658',   // Medium - card backgrounds, secondary surfaces
    tertiary: '#897b8c',    // Lightest - elevated elements, highlights
    
    // Accent colors (consistent semantic order across themes)
    accent1: '#deb99a',     // Primary accent: warm gold/sand
    accent2: '#c493b1',     // Secondary accent: rose/mauve
    accent3: '#7C85EB',     // Tertiary accent: soft purple/blue
    
    // Text colors
    textPrimary: '#f8f4f4',
    textSecondary: '#c5bfc2',
    textMuted: '#897b8c',
    
    // Border colors
    border: 'rgba(222, 185, 154, 0.2)',    // accent1 with opacity
    borderHover: 'rgba(222, 185, 154, 0.5)',
    
    // Overlay colors
    overlay: 'rgba(59, 52, 66, 0.6)',       // primary with opacity
    overlayHeavy: 'rgba(59, 52, 66, 0.9)',
  },
  icons: {
    // Sparkle icon - warm gold theme
    sparkleMain: '#deb99a',
    sparkleGem: '#7C85EB',
    sparkleHighlight: '#c493b1',
    
    // Witch icon - same color scheme
    witchMain: '#deb99a',
    witchGem: '#7C85EB',
    witchHighlight: '#c493b1',
    
    // Hexagram icon
    hexagramPrimary: '#deb99a',
    hexagramSecondary: '#c493b1',
  },
  particles: {
    primary: '#deb99a',
  },
};

// =================================================================================
// LIGHT THEME
// Main colors (from lightest to darkest): #F7F8F3, #EBECF2, #e3d8d8
// Accent colors: #deb99a (gold), #7C85EB (purple-blue), #c493b1 (rose)
// Note: accent2 and accent3 are swapped compared to dark theme to provide
// better contrast and visibility on light backgrounds
// =================================================================================
export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    // Main background colors (light to dark gradient)
    primary: '#F7F8F3',     // Lightest - base background, primary surfaces
    secondary: '#EBECF2',   // Medium - card backgrounds, secondary surfaces
    tertiary: '#e3d8d8',    // Darkest - elevated elements, shadows
    
    // Accent colors (consistent semantic meaning, optimized for light backgrounds)
    accent1: '#deb99a',     // Primary accent: warm gold/sand (same across themes)
    accent2: '#7C85EB',     // Secondary accent: purple-blue (swapped for contrast)
    accent3: '#c493b1',     // Tertiary accent: rose/mauve (swapped for contrast)
    
    // Text colors
    textPrimary: '#3b3442',
    textSecondary: '#4d4658',
    textMuted: '#897b8c',
    
    // Border colors
    border: 'rgba(124, 133, 235, 0.2)',    // accent2 with opacity
    borderHover: 'rgba(124, 133, 235, 0.5)',
    
    // Overlay colors
    overlay: 'rgba(247, 248, 243, 0.6)',    // primary with opacity
    overlayHeavy: 'rgba(247, 248, 243, 0.9)',
  },
  icons: {
    // Sparkle icon - purple accent theme for light mode
    sparkleMain: '#7C85EB',
    sparkleGem: '#c493b1',
    sparkleHighlight: '#deb99a',
    
    // Witch icon
    witchMain: '#7C85EB',
    witchGem: '#c493b1',
    witchHighlight: '#deb99a',
    
    // Hexagram icon
    hexagramPrimary: '#7C85EB',
    hexagramSecondary: '#c493b1',
  },
  particles: {
    primary: '#7C85EB',
  },
};

// =================================================================================
// THEME UTILITIES
// =================================================================================

export const getTheme = (mode: ThemeMode): Theme => {
  return mode === 'dark' ? darkTheme : lightTheme;
};

// Default theme
export const defaultTheme = darkTheme;
