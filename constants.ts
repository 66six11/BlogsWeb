
import { BlogPost, Project } from './types';

// --- Environment Variable Helper ---
// Safely retrieves env vars from process.env (Webpack/Node) or import.meta.env (Vite)
// Checks for VITE_ and REACT_APP_ prefixes automatically.
export const getEnv = (key: string): string => {
  const prefixes = ['', 'VITE_', 'REACT_APP_'];
  
  for (const prefix of prefixes) {
    const fullKey = prefix + key;
    
    // 1. Try Vite (import.meta.env)
    try {
      // @ts-ignore
      if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[fullKey]) {
        // @ts-ignore
        return import.meta.env[fullKey];
      }
    } catch (e) { /* ignore */ }

    // 2. Try Node/Webpack (process.env)
    try {
      if (typeof process !== 'undefined' && typeof process.env !== 'undefined' && process.env[fullKey]) {
        return process.env[fullKey];
      }
    } catch (e) { /* ignore */ }
  }
  
  return "";
};

export const APP_TITLE = "The Wandering Dev";
export const AUTHOR_NAME = "Elaina's Disciple";

// GitHub Configuration
export const GITHUB_USERNAME = "66six11"; 
export const GITHUB_REPO = "MyNotes";
export const GITHUB_BLOG_PATH = ""; // Root traversal
export const GITHUB_TOKEN = getEnv('GITHUB_TOKEN');

// Assets
export const BG_MEDIA_URL = "/Elaina.mp4"; 
export const BGM_URL = "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3"; 

// Fallback Mock Posts
export const MOCK_POSTS: BlogPost[] = [
  {
    id: 'syntax-guide',
    title: 'Grimoire Syntax Guide',
    date: '2025-01-01',
    category: 'Meta',
    tags: ['Markdown', 'Documentation', 'Magic'],
    path: 'Meta/Grimoire Syntax Guide.md',
    excerpt: 'A comprehensive guide to the magical inscriptions (Markdown) supported by this grimoire, including mathematical formulas, callouts, and tabular data.',
    content: `
# Grimoire Syntax Guide

Welcome, traveler. This page demonstrates the rendering capabilities of this magical tome.

## 1. Typography & Emphasis
We support standard **bold text**, *italicized text*, and \`inline code\`.

## 2. Mathematical Incantations (LaTeX)
Render complex mathematical spells using KaTeX.

**Inline Math:** The energy of a spell is $E = mc^2$.

**Block Math:**
The Rendering Equation:
$$ L_o(x, \\omega_o) = L_e(x, \\omega_o) + \\int_{\\Omega} f_r(x, \\omega_i, \\omega_o) L_i(x, \\omega_i) (\\omega_i \\cdot n) d\\omega_i $$

## 3. Admonitions (Callouts)
Special blocks for highlighting information.

> [!INFO] Magical Knowledge
> This is an informational block. Useful for general notes.

> [!WARNING] Dangerous Spell
> Be careful! Infinite loops may cause the universe to crash.

> [!TIP] Pro Tip
> Always normalize your vectors before calculating dot products.

> [!BUG] Glitch in the Matrix
> A wild bug appeared!

> [!QUOTE] Elaina
> "I am the Ashes Witch, Elaina."

## 4. Structured Data (Tables)

| Element | Mana Cost | Effect |
|:--------|:----------|:-------|
| Fire    | 15 MP     | Burns target over time |
| Ice     | 20 MP     | Slows movement speed |
| Thunder | 25 MP     | Stuns enemies |

## 5. Task Lists (Quest Log)
- [x] Initialize Render Pipeline
- [x] Load Assets
- [ ] Implement Global Illumination
- [ ] Fix Memory Leak

## 6. Code Transmutation

\`\`\`csharp
// Unity C# Script
using UnityEngine;

public class Fireball : MonoBehaviour {
    void Update() {
        transform.Translate(Vector3.forward * Time.deltaTime * 10f);
    }
}
\`\`\`

## 7. Images
Standard Markdown images and Obsidian embeds work here.
![Magic Sparks](https://picsum.photos/id/1/600/300)
    `
  },
  {
    id: '1',
    title: 'Implementing Shadow Mapping in OpenGL',
    date: '2023-10-15',
    category: 'Computer Graphics',
    tags: ['C++', 'OpenGL', 'Rendering'],
    path: 'Computer Graphics/Shadow Mapping.md',
    excerpt: 'A deep dive into the mathematics behind shadow mapping and handling PCF filtering.',
    content: `
# Shadow Mapping Basics

Shadow mapping is a process by which shadows are added to 3D computer graphics.

## The Concept
1. Render the scene from the light's point of view.
2. Store the depth information in a texture (Shadow Map).
3. Render the scene from the camera's point of view, checking if a fragment is occluded.

## Math Example

Here is the GGX Distribution function:

$$D_{\\text{GGX}} = \\frac{\\alpha^2}{\\pi[(\\mathbf{n} \\cdot \\mathbf{h})^2(\\alpha^2 - 1) + 1]^2}$$

It is essential to handle **Peter Panning** artifacts by applying a bias.
    `
  },
  {
    id: '2',
    title: 'Unity DOTS: A Performance Revolution',
    date: '2023-11-20',
    category: 'Unity',
    tags: ['C#', 'DOTS', 'ECS'],
    path: 'Unity/DOTS/Performance Revolution.md',
    excerpt: 'How Data-Oriented Technology Stack changes the way we think about game architecture.',
    content: `
# Moving to ECS

Entity Component System (ECS) is a pattern used in game development that favors composition over inheritance.

#### Table Example: Components

| Component | Data Type | Usage |
|-----------|-----------|-------|
| Translation | float3 | Position in world space |
| Rotation | quaternion | Orientation |
| Velocity | float3 | Physics movement |

> "Performance by default." - Unity Technologies
    `
  }
];

export const PROJECTS: Project[] = [
  {
    id: 'p1',
    title: 'Custom Voxel Engine',
    description: 'A Minecraft-like voxel engine written in C++ and Vulkan. Supports infinite terrain generation and dynamic lighting.',
    image: 'https://picsum.photos/600/400?random=1',
    tech: ['C++', 'Vulkan', 'Compute Shaders']
  },
  {
    id: 'p2',
    title: 'Melody Witch',
    description: 'A rhythm game made in Unity where you cast spells by playing piano chords.',
    image: 'https://picsum.photos/600/400?random=2',
    tech: ['Unity', 'C#', 'MIDI']
  },
  {
    id: 'p3',
    title: 'Digital Sketchbook',
    description: 'Collection of digital paintings focusing on anime backgrounds and environments.',
    image: 'https://picsum.photos/600/400?random=3',
    tech: ['Photoshop', 'Blender']
  }
];
