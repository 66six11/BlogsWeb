
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { textToParticles, ParticlePosition } from '../utils/textToParticles';

export type ParticleMode = 'scattered' | 'forming' | 'formed' | 'dispersing';

interface Scene3DProps {
  analyser?: AnalyserNode;
  mode?: ParticleMode;
  text?: string;
  onFormingComplete?: () => void;
  onDispersingComplete?: () => void;
}

const Scene3D: React.FC<Scene3DProps> = ({ 
  analyser, 
  mode = 'scattered',
  text = 'MagicDev',
  onFormingComplete,
  onDispersingComplete,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const prevModeRef = useRef<ParticleMode>(mode);

  useEffect(() => {
    if (!mountRef.current) return;

    // --- Setup Scene ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // --- Particles (Audio Reactive with Text Formation) ---
    const particlesCount = 2000;
    const posArray = new Float32Array(particlesCount * 3);
    const randomArray = new Float32Array(particlesCount * 3);
    const targetArray = new Float32Array(particlesCount * 3);
    
    // Initialize scattered positions
    for(let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 20; // Spread wider
      randomArray[i] = Math.random(); // Used for offset logic
      targetArray[i] = posArray[i]; // Initially same as position
    }

    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('aRandom', new THREE.BufferAttribute(randomArray, 3));
    particlesGeometry.setAttribute('aTarget', new THREE.BufferAttribute(targetArray, 3));

    const particleVertexShader = `
      uniform float uTime;
      uniform float uBeat;
      uniform float uMorphProgress; // 0 = scattered, 1 = formed
      uniform float uEmissionIntensity; // Emission effect intensity
      attribute vec3 aRandom;
      attribute vec3 aTarget;
      varying float vAlpha;
      
      void main() {
        vec3 pos = position;
        vec3 targetPos = aTarget;
        
        // Lerp between scattered and target position
        pos = mix(pos, targetPos, uMorphProgress);
        
        // --- Physics & Rhythm Logic (only when scattered or dispersing) ---
        float scatterFactor = 1.0 - uMorphProgress;
        
        if (scatterFactor > 0.1) {
          // 1. Orbital Rotation
          float angle = uTime * 0.2 * (0.5 + aRandom.x) * scatterFactor;
          float s = sin(angle);
          float c = cos(angle);
          
          float xNew = pos.x * c - pos.z * s;
          float zNew = pos.x * s + pos.z * c;
          pos.x = xNew;
          pos.z = zNew;

          // 2. Vertical Flow
          pos.y += mod(uTime * (1.0 + aRandom.y) + pos.y, 20.0) - 10.0;
          pos.y *= scatterFactor;

          // 3. Audio Reactivity (Beat Pulse)
          vec3 dir = normalize(pos);
          pos += dir * uBeat * 2.0 * aRandom.z * scatterFactor;

          // 4. Wave Motion
          pos.x += sin(uTime * 2.0 + pos.y) * 0.2 * scatterFactor;
        }
        
        // Emission effect when formed - particles radiate from text
        if (uMorphProgress > 0.9 && uEmissionIntensity > 0.0) {
          vec3 emissionDir = normalize(aRandom - 0.5);
          float emissionDist = aRandom.x * 0.5 * uEmissionIntensity;
          pos += emissionDir * emissionDist * sin(uTime * 3.0 + aRandom.y * 6.28);
        }

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        // Size reacts to depth, beat, and formation
        float baseSize = 3.0 + uBeat * 4.0;
        float formationSize = mix(baseSize, baseSize * 0.7, uMorphProgress);
        gl_PointSize = formationSize * (15.0 / -mvPosition.z);
        
        // Opacity
        vAlpha = 0.4 + uBeat * 0.6;
      }
    `;

    const particleFragmentShader = `
      uniform vec3 uColor;
      varying float vAlpha;
      void main() {
        // Soft circular particle
        vec2 coord = gl_PointCoord - vec2(0.5);
        float r = length(coord);
        if (r > 0.5) discard;
        
        // Glow gradient
        float glow = 1.0 - (r * 2.0);
        glow = pow(glow, 2.0); // Sharper falloff

        gl_FragColor = vec4(uColor, vAlpha * glow);
      }
    `;

    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBeat: { value: 0 },
        uMorphProgress: { value: 0 },
        uEmissionIntensity: { value: 0 },
        uColor: { value: new THREE.Color('#fbbf24') } // Gold
      },
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particleMaterial);
    scene.add(particlesMesh);

    // --- Animation State ---
    const clock = new THREE.Clock();
    if (analyser) {
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    }
    
    // Simulated time for particles
    let particleTime = 0;
    let morphProgress = 0;
    let targetMorphProgress = 0;
    let transitionStartTime = 0;
    let transitionDuration = 2.0; // seconds
    
    // Generate text particle positions
    let textParticlePositions: ParticlePosition[] = [];
    
    // Function to update target positions based on mode
    const updateTargetPositions = (newMode: ParticleMode) => {
      if (newMode === 'forming' || newMode === 'formed') {
        // Generate text particle positions
        textParticlePositions = textToParticles(text, {
          fontSize: 100,
          resolution: 4,
          minAlpha: 100,
        });
        
        // Update target positions
        const targets = particlesGeometry.getAttribute('aTarget') as THREE.BufferAttribute;
        const positions = particlesGeometry.getAttribute('position') as THREE.BufferAttribute;
        
        for (let i = 0; i < particlesCount; i++) {
          if (i < textParticlePositions.length) {
            // Assign to text position
            const textPos = textParticlePositions[i];
            targets.setXYZ(i, textPos.x, textPos.y, 0);
          } else {
            // Excess particles go to random positions around the text
            const angle = Math.random() * Math.PI * 2;
            const radius = 2 + Math.random() * 3;
            targets.setXYZ(
              i,
              Math.cos(angle) * radius,
              Math.sin(angle) * radius,
              (Math.random() - 0.5) * 2
            );
          }
        }
        targets.needsUpdate = true;
        
        // Set target morph progress
        targetMorphProgress = 1.0;
      } else {
        // Dispersing or scattered - return to random positions
        const targets = particlesGeometry.getAttribute('aTarget') as THREE.BufferAttribute;
        const positions = particlesGeometry.getAttribute('position') as THREE.BufferAttribute;
        
        for (let i = 0; i < particlesCount; i++) {
          // Set targets to random scatter positions
          targets.setXYZ(
            i,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20
          );
        }
        targets.needsUpdate = true;
        
        // Set target morph progress
        targetMorphProgress = 0.0;
      }
      
      transitionStartTime = clock.getElapsedTime();
    };
    
    // Initialize based on initial mode
    updateTargetPositions(mode);

    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();
      
      // --- Audio Analysis ---
      let beat = 0;
      if (analyser && dataArrayRef.current) {
          analyser.getByteFrequencyData(dataArrayRef.current);
          
          // Get low frequency average (Bass)
          let sum = 0;
          const range = 20; // First 20 bins
          for (let i = 0; i < range; i++) {
              sum += dataArrayRef.current[i];
          }
          const avg = sum / range;
          beat = Math.pow(avg / 255, 2); // Square it to make weak sounds weaker, strong sounds stronger
      }

      // Smooth beat value for visuals
      particleMaterial.uniforms.uBeat.value = THREE.MathUtils.lerp(
          particleMaterial.uniforms.uBeat.value, 
          beat, 
          0.15
      );

      // --- Handle Mode Transitions ---
      // Check if mode changed from parent
      if (mode !== prevModeRef.current) {
        updateTargetPositions(mode);
        prevModeRef.current = mode;
      }
      
      // Smooth morph progress transition
      const transitionProgress = Math.min((elapsedTime - transitionStartTime) / transitionDuration, 1.0);
      morphProgress = THREE.MathUtils.lerp(morphProgress, targetMorphProgress, transitionProgress * 0.1);
      particleMaterial.uniforms.uMorphProgress.value = morphProgress;
      
      // Check if transition is complete
      if (transitionProgress >= 0.99) {
        if (mode === 'forming' && Math.abs(morphProgress - 1.0) < 0.01) {
          // Forming complete, notify parent
          onFormingComplete?.();
        } else if (mode === 'dispersing' && Math.abs(morphProgress) < 0.01) {
          // Dispersing complete, notify parent
          onDispersingComplete?.();
        }
      }
      
      // Emission effect when formed
      if (mode === 'formed') {
        particleMaterial.uniforms.uEmissionIntensity.value = 0.3 + beat * 0.4;
      } else {
        particleMaterial.uniforms.uEmissionIntensity.value = 0;
      }

      // --- Particle Physics Update ---
      // Accelerate time based on beat (Music makes particles move faster)
      particleTime += delta * (0.5 + beat * 3.0); 
      particleMaterial.uniforms.uTime.value = particleTime;

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Init size

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      particlesGeometry.dispose();
      particleMaterial.dispose();
    };
  }, [analyser, mode, text, onFormingComplete, onDispersingComplete]);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
};

export default Scene3D;
