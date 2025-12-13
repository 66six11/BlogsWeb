/**
 * 文字粒子系统组件 - 使用Three.js实现的文字粒子效果
 * @file src/components/features/3d/TextParticleSystem.tsx
 * @description 创建文字形状的粒子系统，粒子会从随机位置聚拢形成指定文字，并在形成后保持微小波动效果
 * @created 2025-12-13
 */

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

/**
 * 文字粒子系统组件属性接口
 * @interface TextParticleSystemProps
 * @description 定义了文字粒子系统组件的输入属性
 */
interface TextParticleSystemProps {
    text: string;              // 要显示的文字内容
    isVisible: boolean;        // 粒子系统是否可见
    analyser?: AnalyserNode;   // 音频分析器节点（可选），用于实现音频响应效果
    onComplete?: () => void;   // 粒子系统形成文字后的回调函数（可选）
}

/**
 * 文字粒子系统组件
 * @component TextParticleSystem
 * @description 使用Three.js创建文字粒子效果，粒子从随机位置聚拢形成指定文字，并在形成后保持微小波动
 */
const TextParticleSystem: React.FC<TextParticleSystemProps> = ({ 
    text,         // 要显示的文字内容
    isVisible,     // 粒子系统是否可见
    analyser,     // 音频分析器节点
    onComplete    // 粒子系统形成文字后的回调函数
}) => {
    /** DOM元素引用 - 用于挂载Three.js渲染器 */
    const mountRef = useRef<HTMLDivElement>(null);
    /** 场景引用 - 用于存储Three.js场景实例 */
    const sceneRef = useRef<THREE.Scene | null>(null);
    /** 渲染器引用 - 用于存储Three.js渲染器实例 */
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    /** 粒子引用 - 用于存储Three.js粒子实例 */
    const particlesRef = useRef<THREE.Points | null>(null);
    /** 动画ID引用 - 用于存储动画帧ID，以便取消动画 */
    const animationIdRef = useRef<number | null>(null);
    /** 是否正在形成文字 - 状态管理 */
    const [isForming, setIsForming] = useState(false);
    /** 是否已形成文字 - 状态管理 */
    const [isFormed, setIsFormed] = useState(false);

    /**
     * 创建文字粒子目标位置
     * @param {string} text - 要转换为粒子的文字
     * @returns {THREE.Vector3[]} 文字粒子的目标位置数组
     * @description 1. 创建临时画布
     *              2. 在画布上绘制文字
     *              3. 提取文字像素数据
     *              4. 将文字像素转换为3D粒子位置
     */
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
        
        // 在画布中心绘制文字
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        // 获取画布像素数据
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const particles: THREE.Vector3[] = [];

        // 采样间隔 - 控制粒子密度
        const gap = 6;
        
        // 遍历画布像素，生成粒子位置
        for (let y = 0; y < canvas.height; y += gap) {
            for (let x = 0; x < canvas.width; x += gap) {
                const index = (y * canvas.width + x) * 4;
                const alpha = imageData.data[index + 3]; // 获取像素透明度
                
                // 如果透明度大于阈值，生成粒子
                if (alpha > 128) {
                    // 转换到3D坐标系 - 调整大小和位置
                    const posX = (x - canvas.width / 2) * 0.02;
                    const posY = -(y - canvas.height / 2) * 0.02;
                    const posZ = 0;
                    
                    particles.push(new THREE.Vector3(posX, posY, posZ));
                }
            }
        }

        return particles;
    };

    /**
     * 组件挂载时初始化文字粒子系统
     * @description 1. 初始化Three.js场景、相机和渲染器
     *              2. 创建文字粒子目标位置
     *              3. 初始化粒子系统
     *              4. 设置粒子着色器
     *              5. 启动动画循环
     *              6. 添加窗口大小调整处理
     *              7. 清理资源
     */
    useEffect(() => {
        // 如果不可见或挂载元素不存在，直接返回
        if (!isVisible || !mountRef.current) return;

        // 初始化Three.js场景
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // 设置透视相机
        const camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        camera.position.z = 5; // 相机位置

        // 设置WebGL渲染器
        const renderer = new THREE.WebGLRenderer({ 
            alpha: true,      // 启用透明背景
            antialias: true   // 启用抗锯齿
        });
        renderer.setSize(window.innerWidth, window.innerHeight); // 设置渲染器大小
        renderer.setPixelRatio(window.devicePixelRatio); // 设置像素比
        mountRef.current.appendChild(renderer.domElement); // 将渲染器DOM元素添加到挂载元素
        rendererRef.current = renderer;

        // 粒子系统配置
        const particlesCount = 3000; // 粒子数量
        const positions = new Float32Array(particlesCount * 3); // 粒子当前位置
        const targetPositions = new Float32Array(particlesCount * 3); // 粒子目标位置
        const randomFactors = new Float32Array(particlesCount * 3); // 粒子随机因子

        // 初始化粒子位置 - 随机分布在空间中
        for (let i = 0; i < particlesCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 20; // X坐标
            positions[i + 1] = (Math.random() - 0.5) * 20; // Y坐标
            positions[i + 2] = (Math.random() - 0.5) * 20; // Z坐标
            
            // 初始化随机因子
            randomFactors[i] = Math.random();
            randomFactors[i + 1] = Math.random();
            randomFactors[i + 2] = Math.random();
        }

        // 获取文字粒子目标位置
        const textParticles = createTextParticles(text);
        
        // 将文字粒子位置分配给目标位置数组
        for (let i = 0; i < particlesCount * 3; i += 3) {
            if (i / 3 < textParticles.length) {
                // 使用文字粒子位置
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

        // 创建粒子几何体
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('targetPosition', new THREE.BufferAttribute(targetPositions, 3));
        geometry.setAttribute('randomFactor', new THREE.BufferAttribute(randomFactors, 3));

        // 创建粒子着色器材质
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },          // 时间统一变量
                uBeat: { value: 0 },          // 节拍强度统一变量
                uProgress: { value: 0 },      // 聚拢进度统一变量
                uColor: { value: new THREE.Color('#fbbf24') }, // 粒子颜色 - 金色
                uIsFormed: { value: 0 }       // 是否已形成文字统一变量
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
                    
                    // 计算模型视图投影矩阵
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    
                    // 粒子大小计算
                    float size = 0.05 + uBeat * 0.05;
                    if (uIsFormed > 0.5) {
                        size *= (0.8 + randomFactor.x * 0.4);
                    }
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                
                void main() {
                    // 圆形粒子效果
                    vec2 coord = gl_PointCoord - vec2(0.5);
                    float r = length(coord);
                    if (r > 0.5) discard;
                    
                    // 发光渐变效果
                    float glow = 1.0 - (r * 2.0);
                    glow = pow(glow, 2.0);
                    
                    gl_FragColor = vec4(uColor, glow * 0.8);
                }
            `,
            transparent: true,               // 启用透明度
            blending: THREE.AdditiveBlending, // 使用 additive blending 实现发光效果
            depthWrite: false                // 关闭深度写入，避免粒子被错误遮挡
        });

        // 创建粒子并添加到场景
        const particles = new THREE.Points(geometry, material);
        scene.add(particles);
        particlesRef.current = particles;

        // 动画参数
        const clock = new THREE.Clock(); // 时钟，用于计算动画时间
        let progress = 0;               // 聚拢进度
        let isForming = false;          // 是否正在形成文字
        let formationComplete = false;   // 文字是否形成完成
        
        // 音频数据数组
        let dataArray: Uint8Array | null = null;
        if (analyser) {
            dataArray = new Uint8Array(analyser.frequencyBinCount);
        }

        /**
         * 动画循环函数
         * @description 1. 请求下一帧动画
         *              2. 计算时间增量
         *              3. 分析音频数据，计算节拍强度
         *              4. 更新聚拢进度
         *              5. 更新粒子状态
         *              6. 渲染场景
         */
        const animate = () => {
            animationIdRef.current = requestAnimationFrame(animate); // 请求下一帧
            
            const delta = clock.getDelta(); // 获取时间增量
            const elapsedTime = clock.getElapsedTime(); // 获取累计时间
            
            // --- 音频分析 ---
            let beat = 0; // 节拍强度初始值
            if (analyser && dataArray) {
                analyser.getByteFrequencyData(dataArray); // 获取音频频率数据
                
                // 计算低频平均值（Bass）
                let sum = 0;
                const range = 20; // 前20个频率 bin
                for (let i = 0; i < range; i++) {
                    sum += dataArray[i];
                }
                const avg = sum / range;
                beat = Math.pow(avg / 255, 2); // 平方处理，增强强音效果
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
                
                // 文字形成完成
                if (progress >= 1.0 && !formationComplete) {
                    formationComplete = true;
                    setIsFormed(true);
                    material.uniforms.uIsFormed.value = 1.0;
                    onComplete?.(); // 调用完成回调
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

            renderer.render(scene, camera); // 渲染场景
        };

        animate(); // 启动动画循环

        /**
         * 窗口大小调整处理函数
         * @description 1. 更新相机宽高比
         *              2. 更新相机投影矩阵
         *              3. 更新渲染器大小
         */
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        // 清理函数 - 组件卸载时调用
        return () => {
            window.removeEventListener('resize', handleResize); // 移除窗口大小调整事件监听
            
            // 取消动画循环
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }
            
            // 移除渲染器DOM元素
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            
            // 释放资源
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
            style={{ zIndex: 15 }} // 设置z-index，确保粒子系统显示在正确层级
        />
    );
};

export default TextParticleSystem;