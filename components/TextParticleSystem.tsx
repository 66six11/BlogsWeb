import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

interface TextParticleSystemProps {
    text: string;
    isVisible: boolean;
    analyser?: AnalyserNode;
    onComplete?: () => void;
}

const TextParticleSystem: React.FC<TextParticleSystemProps> = ({ 
    text, 
    isVisible, 
    analyser,
    onComplete 
}) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const particlesRef = useRef<THREE.Points | null>(null);
    const animationIdRef = useRef<number | null>(null);
    const [isForming, setIsForming] = useState(false);
    const [isFormed, setIsFormed] = useState(false);

    // 创建文字粒子目标位置
    const createTextParticles = (text: string) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return [];

        // 设置画布大小
        canvas.width = 800;
        canvas.height = 200;

        // 设置文字样式
        ctx.fillStyle = 'white';
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 绘制文字
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        // 获取像素数据
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const particles: THREE.Vector3[] = [];

        // 采样间隔
        const gap = 6;
        
        for (let y = 0; y < canvas.height; y += gap) {
            for (let x = 0; x < canvas.width; x += gap) {
                const index = (y * canvas.width + x) * 4;
                const alpha = imageData.data[index + 3];
                
                if (alpha > 128) {
                    // 转换到3D坐标系
                    const posX = (x - canvas.width / 2) * 0.02;
                    const posY = -(y - canvas.height / 2) * 0.02;
                    const posZ = 0;
                    
                    particles.push(new THREE.Vector3(posX, posY, posZ));
                }
            }
        }

        return particles;
    };

    useEffect(() => {
        if (!isVisible || !mountRef.current) return;

        // 初始化场景
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // 设置相机
        const camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        camera.position.z = 5;

        // 设置渲染器
        const renderer = new THREE.WebGLRenderer({ 
            alpha: true, 
            antialias: true 
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        mountRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // 创建粒子系统
        const particlesCount = 3000;
        const positions = new Float32Array(particlesCount * 3);
        const targetPositions = new Float32Array(particlesCount * 3);
        const randomFactors = new Float32Array(particlesCount * 3);

        // 初始化粒子位置（随机分布）
        for (let i = 0; i < particlesCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 20;
            positions[i + 1] = (Math.random() - 0.5) * 20;
            positions[i + 2] = (Math.random() - 0.5) * 20;
            
            randomFactors[i] = Math.random();
            randomFactors[i + 1] = Math.random();
            randomFactors[i + 2] = Math.random();
        }

        // 获取文字粒子目标位置
        const textParticles = createTextParticles(text);
        
        // 将文字粒子位置分配给目标位置
        for (let i = 0; i < particlesCount * 3; i += 3) {
            if (i / 3 < textParticles.length) {
                const particle = textParticles[i / 3];
                targetPositions[i] = particle.x;
                targetPositions[i + 1] = particle.y;
                targetPositions[i + 2] = particle.z;
            } else {
                // 多余的粒子保持在中心附近
                targetPositions[i] = (Math.random() - 0.5) * 2;
                targetPositions[i + 1] = (Math.random() - 0.5) * 2;
                targetPositions[i + 2] = (Math.random() - 0.5) * 2;
            }
        }

        // 创建几何体
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('targetPosition', new THREE.BufferAttribute(targetPositions, 3));
        geometry.setAttribute('randomFactor', new THREE.BufferAttribute(randomFactors, 3));

        // 创建着色器材质
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uBeat: { value: 0 },
                uProgress: { value: 0 }, // 聚拢进度
                uColor: { value: new THREE.Color('#fbbf24') },
                uIsFormed: { value: 0 }
            },
            vertexShader: `
                uniform float uTime;
                uniform float uBeat;
                uniform float uProgress;
                uniform float uIsFormed;
                attribute vec3 targetPosition;
                attribute vec3 randomFactor;
                
                void main() {
                    vec3 pos = position;
                    
                    if (uIsFormed > 0.5) {
                        // 已形成文字状态
                        vec3 targetPos = targetPosition;
                        
                        // 基础位置插值
                        pos = mix(position, targetPos, uProgress);
                        
                        // 添加微小的波动效果
                        float wave = sin(uTime * 3.0 + randomFactor.x * 10.0) * 0.02;
                        pos.x += wave * randomFactor.x;
                        pos.y += cos(uTime * 2.0 + randomFactor.y * 10.0) * 0.02;
                        
                        // 音频响应
                        if (uBeat > 0.1) {
                            vec3 dir = normalize(targetPos);
                            pos += dir * uBeat * 0.1 * randomFactor.z;
                        }
                    } else {
                        // 聚拢过程
                        vec3 targetPos = targetPosition;
                        
                        // 插值到目标位置
                        pos = mix(position, targetPos, uProgress);
                        
                        // 添加螺旋运动
                        float angle = uTime * 2.0 + randomFactor.x * 6.28;
                        float radius = (1.0 - uProgress) * 0.5;
                        pos.x += cos(angle) * radius;
                        pos.y += sin(angle) * radius;
                    }
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    
                    // 粒子大小
                    float size = 0.05 + uBeat * 0.05;
                    if (uIsFormed > 0.5) {
                        size *= (0.8 + randomFactor.x * 0.4);
                    }
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                varying float vAlpha;
                
                void main() {
                    vec2 coord = gl_PointCoord - vec2(0.5);
                    float r = length(coord);
                    if (r > 0.5) discard;
                    
                    float glow = 1.0 - (r * 2.0);
                    glow = pow(glow, 2.0);
                    
                    gl_FragColor = vec4(uColor, glow * 0.8);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const particles = new THREE.Points(geometry, material);
        scene.add(particles);
        particlesRef.current = particles;

        // 动画参数
        const clock = new THREE.Clock();
        let progress = 0;
        let isForming = false;
        let formationComplete = false;
        
        // 音频数据
        let dataArray: Uint8Array | null = null;
        if (analyser) {
            dataArray = new Uint8Array(analyser.frequencyBinCount);
        }

        const animate = () => {
            animationIdRef.current = requestAnimationFrame(animate);
            
            const delta = clock.getDelta();
            const elapsedTime = clock.getElapsedTime();
            
            // 音频分析
            let beat = 0;
            if (analyser && dataArray) {
                analyser.getByteFrequencyData(dataArray);
                
                let sum = 0;
                const range = 20;
                for (let i = 0; i < range; i++) {
                    sum += dataArray[i];
                }
                const avg = sum / range;
                beat = Math.pow(avg / 255, 2);
            }

            // 开始聚拢动画
            if (!isForming) {
                isForming = true;
                setIsForming(true);
            }

            // 更新聚拢进度
            if (progress < 1.0) {
                progress += delta * 0.3; // 3秒完成聚拢
                progress = Math.min(progress, 1.0);
                
                if (progress >= 1.0 && !formationComplete) {
                    formationComplete = true;
                    setIsFormed(true);
                    material.uniforms.uIsFormed.value = 1.0;
                    onComplete?.();
                }
                
                material.uniforms.uProgress.value = progress;
            }

            // 更新着色器参数
            material.uniforms.uTime.value = elapsedTime;
            material.uniforms.uBeat.value = THREE.MathUtils.lerp(
                material.uniforms.uBeat.value, 
                beat, 
                0.15
            );

            renderer.render(scene, camera);
        };

        animate();

        // 窗口大小调整
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
            geometry.dispose();
            material.dispose();
        };
    }, [isVisible, text, analyser, onComplete]);

    return (
        <div 
            ref={mountRef} 
            className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-1000 ${
                isVisible ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ zIndex: 15 }}
        />
    );
};

export default TextParticleSystem;