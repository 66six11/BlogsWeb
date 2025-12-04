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
// Main colors: #897b8c, #4d4658, #3b3442
// Accent colors: #deb99a, #c493b1, #7C85EB
// =================================================================================
export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    // Main background colors
    primary: '#3b3442',     // Darkest - base background
    secondary: '#4d4658',   // Medium - card backgrounds
    tertiary: '#897b8c',    // Lightest - elevated elements
    
    // Accent colors
    accent1: '#deb99a',     // Warm gold/sand
    accent2: '#c493b1',     // Rose/mauve
    accent3: '#7C85EB',     // Soft purple/blue
    
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
// Main colors: #F7F8F3, #EBECF2, #e3d8d8
// Accent colors: #deb99a, #7C85EB, #c493b1
// =================================================================================
export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    // Main background colors
    primary: '#F7F8F3',     // Lightest - base background
    secondary: '#EBECF2',   // Medium - card backgrounds
    tertiary: '#e3d8d8',    // Darkest accent - elevated elements
    
    // Accent colors (slightly different order for light theme)
    accent1: '#deb99a',     // Warm gold/sand
    accent2: '#7C85EB',     // Soft purple/blue
    accent3: '#c493b1',     // Rose/mauve
    
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
