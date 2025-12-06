
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { textToParticles, generateScatterParticles, type ParticlePosition } from '../utils/textToParticles';

export type ParticleState = 'ambient' | 'forming' | 'formed' | 'scattering';

interface Scene3DProps {
  analyser?: AnalyserNode;
  particleState?: ParticleState;
  titleText?: string;
  onFormingComplete?: () => void;
}

const Scene3D: React.FC<Scene3DProps> = ({ 
  analyser, 
  particleState = 'ambient',
  titleText = '魔法Dev',
  onFormingComplete
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const stateRef = useRef<ParticleState>(particleState);

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

    // Generate title particle positions
    const titleParticles = textToParticles(titleText, {
      fontSize: 80,
      samplingRate: 3,
      particleSpacing: 0.04,
      maxParticles: 1500
    });

    // Generate scatter particles (emanating from text)
    const scatterParticles = generateScatterParticles(
      titleParticles,
      80,
      1.5
    );

    // Combine all target particles
    const allTargetParticles = [...titleParticles, ...scatterParticles];

    // --- Particles (Audio Reactive) ---
    const particlesCount = 2000;
    const posArray = new Float32Array(particlesCount * 3);
    const targetArray = new Float32Array(particlesCount * 3);
    const originalArray = new Float32Array(particlesCount * 3);
    const randomArray = new Float32Array(particlesCount * 3);
    
    // Initialize particles in random positions (ambient state)
    for(let i = 0; i < particlesCount * 3; i++) {
      const randomPos = (Math.random() - 0.5) * 20;
      posArray[i] = randomPos;
      originalArray[i] = randomPos; // Save original positions
      targetArray[i] = randomPos; // Initially target is same as position
      randomArray[i] = Math.random(); // Used for offset logic
    }

    // Set initial target positions based on state
    if (particleState === 'forming' || particleState === 'formed') {
      for (let i = 0; i < particlesCount; i++) {
        const idx = i * 3;
        if (i < allTargetParticles.length) {
          targetArray[idx] = allTargetParticles[i].x;
          targetArray[idx + 1] = allTargetParticles[i].y;
          targetArray[idx + 2] = allTargetParticles[i].z;
        } else {
          // Extra particles go around the text randomly
          const randomBase = titleParticles[Math.floor(Math.random() * titleParticles.length)];
          targetArray[idx] = randomBase.x + (Math.random() - 0.5) * 3;
          targetArray[idx + 1] = randomBase.y + (Math.random() - 0.5) * 3;
          targetArray[idx + 2] = randomBase.z + (Math.random() - 0.5) * 1;
        }
      }
    }

    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('aTarget', new THREE.BufferAttribute(targetArray, 3));
    particlesGeometry.setAttribute('aOriginal', new THREE.BufferAttribute(originalArray, 3));
    particlesGeometry.setAttribute('aRandom', new THREE.BufferAttribute(randomArray, 3));

    const particleVertexShader = `
      uniform float uTime;
      uniform float uBeat;
      uniform float uTransition; // 0 = ambient/scatter, 1 = formed
      attribute vec3 aTarget;
      attribute vec3 aOriginal;
      attribute vec3 aRandom;
      varying float vAlpha;
      
      void main() {
        vec3 originalPos = aOriginal;
        vec3 targetPos = aTarget;
        
        // Apply ambient movement to original position
        vec3 ambientPos = originalPos;
        
        // 1. Orbital Rotation
        float angle = uTime * 0.2 * (0.5 + aRandom.x);
        float s = sin(angle);
        float c = cos(angle);
        float xNew = ambientPos.x * c - ambientPos.z * s;
        float zNew = ambientPos.x * s + ambientPos.z * c;
        ambientPos.x = xNew;
        ambientPos.z = zNew;

        // 2. Vertical Flow
        ambientPos.y += mod(uTime * (1.0 + aRandom.y) + ambientPos.y, 20.0) - 10.0;

        // 3. Audio Reactivity (Beat Pulse)
        vec3 dir = normalize(ambientPos);
        ambientPos += dir * uBeat * 2.0 * aRandom.z;

        // 4. Wave Motion
        ambientPos.x += sin(uTime * 2.0 + ambientPos.y) * 0.2;

        // Interpolate between ambient and target based on transition
        vec3 pos = mix(ambientPos, targetPos, uTransition);
        
        // Add slight breathing motion when formed
        if (uTransition > 0.5) {
          float breath = sin(uTime * 1.5 + aRandom.x * 3.14) * 0.02;
          pos += normalize(targetPos) * breath * (1.0 - aRandom.y * 0.5);
        }

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        // Size reacts to depth, beat, and transition
        float baseSize = mix(3.0, 3.5, uTransition);
        gl_PointSize = (baseSize + uBeat * 4.0) * (15.0 / -mvPosition.z);
        
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
        uTransition: { value: particleState === 'formed' ? 1 : 0 },
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
    let currentTransition = particleState === 'formed' ? 1 : 0;
    let targetTransition = currentTransition;

    // Function to update particle targets when state changes
    const updateTargets = (newState: ParticleState) => {
      const targets = particlesGeometry.attributes.aTarget.array as Float32Array;
      
      if (newState === 'forming' || newState === 'formed') {
        // Set targets to text positions
        for (let i = 0; i < particlesCount; i++) {
          const idx = i * 3;
          if (i < allTargetParticles.length) {
            targets[idx] = allTargetParticles[i].x;
            targets[idx + 1] = allTargetParticles[i].y;
            targets[idx + 2] = allTargetParticles[i].z;
          } else {
            const randomBase = titleParticles[Math.floor(Math.random() * titleParticles.length)];
            targets[idx] = randomBase.x + (Math.random() - 0.5) * 3;
            targets[idx + 1] = randomBase.y + (Math.random() - 0.5) * 3;
            targets[idx + 2] = randomBase.z + (Math.random() - 0.5) * 1;
          }
        }
        targetTransition = 1.0;
      } else {
        // Return to ambient positions
        const originals = particlesGeometry.attributes.aOriginal.array as Float32Array;
        for (let i = 0; i < particlesCount * 3; i++) {
          targets[i] = originals[i];
        }
        targetTransition = 0.0;
      }
      
      particlesGeometry.attributes.aTarget.needsUpdate = true;
      stateRef.current = newState;
    }; 

    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      
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

      // --- Transition Update ---
      const transitionSpeed = 1.0; // Smooth transition over 1 second
      currentTransition = THREE.MathUtils.lerp(
        currentTransition,
        targetTransition,
        delta * transitionSpeed
      );
      particleMaterial.uniforms.uTransition.value = currentTransition;

      // Notify when forming is complete
      if (stateRef.current === 'forming' && currentTransition > 0.98) {
        stateRef.current = 'formed';
        onFormingComplete?.();
      }

      // --- Particle Physics Update ---
      // Accelerate time based on beat (Music makes particles move faster)
      particleTime += delta * (0.5 + beat * 3.0); 
      particleMaterial.uniforms.uTime.value = particleTime;

      renderer.render(scene, camera);
    };

    animate();

    // Initial state setup
    if (particleState !== 'ambient') {
      updateTargets(particleState);
    }

    // Resize Handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Init size

    // Handle state changes from external events
    const handleStateChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const newState = customEvent.detail as ParticleState;
      if (newState !== stateRef.current) {
        updateTargets(newState);
      }
    };
    window.addEventListener('particleStateChange', handleStateChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('particleStateChange', handleStateChange);
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      particlesGeometry.dispose();
      particleMaterial.dispose();
    };
  }, [analyser, titleText, onFormingComplete]);

  // Watch for particle state changes from props
  useEffect(() => {
    if (particleState !== stateRef.current) {
      // Trigger state update by dispatching custom event
      window.dispatchEvent(new CustomEvent('particleStateChange', { 
        detail: particleState 
      }));
    }
  }, [particleState]);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
};

export default Scene3D;
