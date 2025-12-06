/**
 * Utility to generate particle positions from text using Canvas2D
 * This avoids Three.js font dependencies and supports system fonts including Chinese
 */

export interface ParticlePosition {
  x: number;
  y: number;
  z: number;
}

/**
 * Generate particle positions from text
 * @param text - The text to convert to particles
 * @param options - Configuration options
 * @returns Array of particle positions
 */
export function textToParticles(
  text: string,
  options: {
    fontSize?: number;
    fontFamily?: string;
    samplingRate?: number; // How densely to sample pixels (1 = every pixel, 2 = every other pixel, etc.)
    particleSpacing?: number; // Space between particles in 3D units
    maxParticles?: number; // Maximum number of particles to generate
  } = {}
): ParticlePosition[] {
  const {
    fontSize = 120,
    fontFamily = "'Playfair Display', serif",
    samplingRate = 3,
    particleSpacing = 0.05,
    maxParticles = 2000
  } = options;

  // Create offscreen canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  if (!ctx) {
    console.error('Failed to get 2D context');
    return [];
  }

  // Set font and measure text
  ctx.font = `${fontSize}px ${fontFamily}`;
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = fontSize * 1.2; // Approximate height

  // Set canvas size with padding
  const padding = 20;
  canvas.width = textWidth + padding * 2;
  canvas.height = textHeight + padding * 2;

  // Draw text
  ctx.fillStyle = 'white';
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const particles: ParticlePosition[] = [];

  // Sample pixels to create particles
  for (let y = 0; y < canvas.height; y += samplingRate) {
    for (let x = 0; x < canvas.width; x += samplingRate) {
      const index = (y * canvas.width + x) * 4;
      const alpha = imageData.data[index + 3];

      // If pixel is visible (has alpha), create a particle
      if (alpha > 128) {
        // Convert canvas coordinates to centered 3D coordinates
        const particleX = (x - canvas.width / 2) * particleSpacing;
        const particleY = -(y - canvas.height / 2) * particleSpacing; // Invert Y for 3D
        const particleZ = 0;

        particles.push({ x: particleX, y: particleY, z: particleZ });

        // Stop if we've reached max particles
        if (particles.length >= maxParticles) {
          return particles;
        }
      }
    }
  }

  return particles;
}

/**
 * Generate random scatter positions around the formed text
 * @param basePositions - The text particle positions
 * @param count - Number of scatter particles to generate
 * @param radius - Radius to scatter particles
 * @returns Array of scatter particle positions
 */
export function generateScatterParticles(
  basePositions: ParticlePosition[],
  count: number = 50,
  radius: number = 2
): ParticlePosition[] {
  // Safety check for empty base positions
  if (basePositions.length === 0) {
    console.warn('generateScatterParticles: basePositions is empty, returning empty array');
    return [];
  }

  const scatterParticles: ParticlePosition[] = [];

  for (let i = 0; i < count; i++) {
    // Pick a random base position
    const basePos = basePositions[Math.floor(Math.random() * basePositions.length)];
    
    // Add random offset
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;
    const height = (Math.random() - 0.5) * radius;

    scatterParticles.push({
      x: basePos.x + Math.cos(angle) * distance,
      y: basePos.y + height,
      z: basePos.z + Math.sin(angle) * distance
    });
  }

  return scatterParticles;
}
