/**
 * Utility to convert text to particle positions using Canvas2D
 * Supports Chinese and English characters without external font files
 */

export interface ParticlePosition {
  x: number;
  y: number;
  originalX: number;
  originalY: number;
}

export interface TextToParticlesOptions {
  fontSize?: number;
  fontFamily?: string;
  resolution?: number; // Sampling density (1 = every pixel, 2 = every 2nd pixel, etc.)
  minAlpha?: number; // Minimum alpha value to consider as part of text
}

/**
 * Convert text to an array of particle positions
 * @param text The text to convert
 * @param options Configuration options
 * @returns Array of particle positions
 */
export function textToParticles(
  text: string,
  options: TextToParticlesOptions = {}
): ParticlePosition[] {
  const {
    fontSize = 120,
    fontFamily = 'Playfair Display, serif',
    resolution = 3,
    minAlpha = 128,
  } = options;

  // Create offscreen canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadAllFrequently: true });
  
  if (!ctx) {
    console.error('Failed to get canvas context');
    return [];
  }

  // Configure canvas and font
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = fontSize * 1.2; // Approximate height with padding

  // Set canvas size with some padding
  canvas.width = Math.ceil(textWidth + 40);
  canvas.height = Math.ceil(textHeight + 40);

  // Re-apply font after canvas resize (canvas state resets)
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';

  // Draw text centered
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  // Extract particle positions from pixels
  const particles: ParticlePosition[] = [];
  
  for (let y = 0; y < canvas.height; y += resolution) {
    for (let x = 0; x < canvas.width; x += resolution) {
      const index = (y * canvas.width + x) * 4;
      const alpha = pixels[index + 3];

      // If pixel is part of the text (has sufficient alpha)
      if (alpha > minAlpha) {
        // Normalize coordinates to center around origin
        const normalizedX = (x - canvas.width / 2) / 100;
        const normalizedY = (y - canvas.height / 2) / 100;
        
        particles.push({
          x: normalizedX,
          y: -normalizedY, // Flip Y to match 3D coordinate system
          originalX: normalizedX,
          originalY: -normalizedY,
        });
      }
    }
  }

  return particles;
}

/**
 * Generate random scatter positions for particles
 * @param count Number of positions to generate
 * @param spread How far particles should be spread
 * @returns Array of random positions
 */
export function generateScatterPositions(
  count: number,
  spread: number = 20
): ParticlePosition[] {
  const positions: ParticlePosition[] = [];
  
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * spread;
    const y = (Math.random() - 0.5) * spread;
    // Note: z is handled separately in the 3D scene, not stored in ParticlePosition
    
    positions.push({
      x,
      y,
      originalX: x,
      originalY: y,
    });
  }
  
  return positions;
}
