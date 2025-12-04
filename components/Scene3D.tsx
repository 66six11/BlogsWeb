
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { defaultTheme } from '../theme';

interface Scene3DProps {
  analyser?: AnalyserNode;
  pianoBeat?: number; // Beat intensity from piano editor (0-1)
}

const Scene3D: React.FC<Scene3DProps> = ({ analyser, pianoBeat = 0 }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const pianoBeatRef = useRef<number>(0);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  // Update piano beat ref when prop changes
  useEffect(() => {
    pianoBeatRef.current = pianoBeat;
    // Directly update material if available for immediate response
    if (materialRef.current) {
      const currentBeat = materialRef.current.uniforms.uBeat.value;
      materialRef.current.uniforms.uBeat.value = Math.max(currentBeat, pianoBeat * 0.8);
    }
  }, [pianoBeat]);

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

    // --- Particles (Audio Reactive) ---
    const particlesCount = 2000;
    const posArray = new Float32Array(particlesCount * 3);
    const randomArray = new Float32Array(particlesCount * 3);
    
    for(let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 20; // Spread wider
      randomArray[i] = Math.random(); // Used for offset logic
    }

    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('aRandom', new THREE.BufferAttribute(randomArray, 3));

    const particleVertexShader = `
      uniform float uTime;
      uniform float uBeat;
      attribute vec3 aRandom;
      varying float vAlpha;
      
      void main() {
        vec3 pos = position;
        
        // --- Physics & Rhythm Logic ---
        
        // 1. Orbital Rotation
        // Rotate around Y axis based on time. 
        // Beat increases rotation speed
        float angle = uTime * 0.2 * (0.5 + aRandom.x);
        float s = sin(angle);
        float c = cos(angle);
        
        // Apply rotation
        float xNew = pos.x * c - pos.z * s;
        float zNew = pos.x * s + pos.z * c;
        pos.x = xNew;
        pos.z = zNew;

        // 2. Vertical Flow
        // Particles rise up
        pos.y += mod(uTime * (1.0 + aRandom.y) + pos.y, 20.0) - 10.0;

        // 3. Audio Reactivity (Beat Pulse)
        // Push particles outward from center based on beat
        vec3 dir = normalize(pos);
        pos += dir * uBeat * 2.0 * aRandom.z; // Explode outward slightly on beat

        // 4. Wave Motion
        pos.x += sin(uTime * 2.0 + pos.y) * 0.2;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        // Size reacts to depth and beat
        gl_PointSize = (3.0 + uBeat * 4.0) * (15.0 / -mvPosition.z);
        
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

    // Use particle color from theme
    const particleColor = defaultTheme.particles.primary;

    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBeat: { value: 0 },
        uColor: { value: new THREE.Color(particleColor) }
      },
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    materialRef.current = particleMaterial;

    const particlesMesh = new THREE.Points(particlesGeometry, particleMaterial);
    scene.add(particlesMesh);

    // --- Animation State ---
    const clock = new THREE.Clock();
    if (analyser) {
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    }
    
    // Simulated time for particles
    let particleTime = 0; 

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

      // Combine BGM beat with piano beat
      const combinedBeat = Math.max(beat, pianoBeatRef.current);

      // Smooth beat value for visuals
      particleMaterial.uniforms.uBeat.value = THREE.MathUtils.lerp(
          particleMaterial.uniforms.uBeat.value, 
          combinedBeat, 
          0.15
      );

      // Decay piano beat over time
      pianoBeatRef.current *= 0.9;

      // --- Particle Physics Update ---
      // Accelerate time based on beat (Music makes particles move faster)
      particleTime += delta * (0.5 + combinedBeat * 3.0); 
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
      mountRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
      particlesGeometry.dispose();
      particleMaterial.dispose();
      materialRef.current = null;
    };
  }, [analyser]);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
};

export default Scene3D;
