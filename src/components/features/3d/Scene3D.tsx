/**
 * 3D场景组件 - 使用Three.js实现的音频响应式粒子系统
 * @file src/components/features/3d/Scene3D.tsx
 * @description 创建一个全屏3D粒子场景，粒子会根据音频输入动态响应，具有轨道旋转、垂直流动和波浪运动效果
 * @created 2025-12-13
 */

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

/**
 * 3D场景组件属性接口
 * @interface Scene3DProps
 * @description 定义了3D场景组件的输入属性
 */
interface Scene3DProps {
  analyser?: AnalyserNode;  // 音频分析器节点（可选），用于实现音频响应效果
}

/**
 * 3D场景组件
 * @component Scene3D
 * @description 使用Three.js创建音频响应式粒子系统，粒子具有轨道旋转、垂直流动和波浪运动效果
 */
const Scene3D: React.FC<Scene3DProps> = ({ analyser }) => {
  /** DOM元素引用 - 用于挂载Three.js渲染器 */
  const mountRef = useRef<HTMLDivElement>(null);
  /** 音频数据数组引用 - 用于存储音频频率数据 */
  const dataArrayRef = useRef<Uint8Array | null>(null);

  /**
   * 组件挂载时初始化3D场景
   * @description 1. 创建Three.js场景、相机和渲染器
   *              2. 初始化音频响应式粒子系统
   *              3. 设置粒子着色器
   *              4. 启动动画循环
   *              5. 添加窗口大小调整处理
   *              6. 清理资源
   */
  useEffect(() => {
    // 如果挂载元素不存在，直接返回
    if (!mountRef.current) return;

    // --- 场景设置 ---
    const scene = new THREE.Scene();
    
    // 创建透视相机 - 视野75度，宽高比为窗口宽高比，近裁剪面0.1，远裁剪面100
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 5; // 相机位置

    // 创建WebGL渲染器 - 启用透明背景和抗锯齿
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight); // 设置渲染器大小
    renderer.setPixelRatio(window.devicePixelRatio); // 设置像素比，确保在高DPI屏幕上显示清晰
    mountRef.current.appendChild(renderer.domElement); // 将渲染器DOM元素添加到挂载元素

    // --- 粒子系统（音频响应式） ---
    const particlesCount = 2000; // 粒子数量
    const posArray = new Float32Array(particlesCount * 3); // 粒子位置数组
    const randomArray = new Float32Array(particlesCount * 3); // 粒子随机因子数组
    
    // 初始化粒子位置和随机因子
    for(let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 20; // 随机分布在-10到10的空间内
      randomArray[i] = Math.random(); // 0到1的随机值，用于粒子的差异化行为
    }

    // 创建粒子几何体
    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3)); // 设置位置属性
    particlesGeometry.setAttribute('aRandom', new THREE.BufferAttribute(randomArray, 3)); // 设置随机因子属性

    // 粒子顶点着色器 - 处理粒子的位置、大小和透明度
    const particleVertexShader = `
      uniform float uTime;     // 时间统一变量
      uniform float uBeat;     // 节拍强度统一变量
      attribute vec3 aRandom;  // 粒子随机因子属性
      varying float vAlpha;    // 传递给片段着色器的透明度
      
      void main() {
        vec3 pos = position;
        
        // --- 物理与节奏逻辑 ---
        
        // 1. 轨道旋转
        // 根据时间和随机因子绕Y轴旋转
        float angle = uTime * 0.2 * (0.5 + aRandom.x);
        float s = sin(angle);
        float c = cos(angle);
        
        // 应用旋转变换
        float xNew = pos.x * c - pos.z * s;
        float zNew = pos.x * s + pos.z * c;
        pos.x = xNew;
        pos.z = zNew;

        // 2. 垂直流动
        // 粒子向上流动，超出边界后重新开始
        pos.y += mod(uTime * (1.0 + aRandom.y) + pos.y, 20.0) - 10.0;

        // 3. 音频响应（节拍脉冲）
        // 根据节拍强度将粒子从中心向外推
        vec3 dir = normalize(pos);
        pos += dir * uBeat * 2.0 * aRandom.z; // 节拍时粒子向外爆炸

        // 4. 波浪运动
        // 粒子在X轴方向产生波浪运动
        pos.x += sin(uTime * 2.0 + pos.y) * 0.2;

        // 计算模型视图投影矩阵
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        // 粒子大小随深度和节拍变化
        gl_PointSize = (3.0 + uBeat * 4.0) * (15.0 / -mvPosition.z);
        
        // 粒子透明度随节拍变化
        vAlpha = 0.4 + uBeat * 0.6;
      }
    `;

    // 粒子片段着色器 - 处理粒子的颜色和发光效果
    const particleFragmentShader = `
      uniform vec3 uColor;    // 粒子颜色统一变量
      varying float vAlpha;   // 从顶点着色器传递过来的透明度
      
      void main() {
        // 圆形粒子 - 计算距离中心的距离
        vec2 coord = gl_PointCoord - vec2(0.5);
        float r = length(coord);
        if (r > 0.5) discard; // 超出半径的部分丢弃
        
        // 发光渐变效果
        float glow = 1.0 - (r * 2.0);
        glow = pow(glow, 2.0); // 更锐利的衰减效果

        // 设置最终颜色 - 包含发光和透明度
        gl_FragColor = vec4(uColor, vAlpha * glow);
      }
    `;

    // 创建粒子材质 - 使用自定义着色器
    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, // 时间初始值
        uBeat: { value: 0 }, // 节拍强度初始值
        uColor: { value: new THREE.Color('#fbbf24') } // 粒子颜色 - 金色
      },
      vertexShader: particleVertexShader, // 顶点着色器
      fragmentShader: particleFragmentShader, // 片段着色器
      transparent: true, // 启用透明度
      blending: THREE.AdditiveBlending, //  additive blending for glow effect
      depthWrite: false, // 关闭深度写入，避免粒子被错误遮挡
    });

    // 创建粒子网格并添加到场景
    const particlesMesh = new THREE.Points(particlesGeometry, particleMaterial);
    scene.add(particlesMesh);

    // --- 动画状态 ---
    const clock = new THREE.Clock(); // 创建时钟，用于计算动画时间
    
    // 如果提供了音频分析器，初始化音频数据数组
    if (analyser) {
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    }
    
    let particleTime = 0; // 粒子模拟时间

    /**
     * 动画循环函数
     * @description 1. 请求下一帧动画
     *              2. 计算时间增量
     *              3. 分析音频数据，计算节拍强度
     *              4. 平滑更新节拍强度
     *              5. 更新粒子物理状态
     *              6. 渲染场景
     */
    const animate = () => {
      requestAnimationFrame(animate); // 请求下一帧
      const delta = clock.getDelta(); // 获取时间增量
      
      // --- 音频分析 ---
      let beat = 0; // 节拍强度初始值
      if (analyser && dataArrayRef.current) {
          analyser.getByteFrequencyData(dataArrayRef.current); // 获取音频频率数据
          
          // 计算低频平均值（Bass）
          let sum = 0;
          const range = 20; // 前20个频率 bin
          for (let i = 0; i < range; i++) {
              sum += dataArrayRef.current[i];
          }
          const avg = sum / range; // 平均值
          beat = Math.pow(avg / 255, 2); // 平方处理，增强强音效果，减弱弱音效果
      }

      // 平滑更新节拍强度，避免视觉跳变
      particleMaterial.uniforms.uBeat.value = THREE.MathUtils.lerp(
          particleMaterial.uniforms.uBeat.value, 
          beat, 
          0.15
      );

      // --- 粒子物理更新 ---
      // 根据节拍加速粒子时间（音乐越强烈，粒子运动越快）
      particleTime += delta * (0.5 + beat * 3.0); 
      particleMaterial.uniforms.uTime.value = particleTime; // 更新时间统一变量

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
      camera.aspect = window.innerWidth / window.innerHeight; // 更新宽高比
      camera.updateProjectionMatrix(); // 更新投影矩阵
      renderer.setSize(window.innerWidth, window.innerHeight); // 更新渲染器大小
    };
    
    window.addEventListener('resize', handleResize); // 添加窗口大小调整事件监听
    handleResize(); // 初始化大小

    // 清理函数 - 组件卸载时调用
    return () => {
      window.removeEventListener('resize', handleResize); // 移除事件监听
      mountRef.current?.removeChild(renderer.domElement); // 移除渲染器DOM元素
      renderer.dispose(); // 释放渲染器资源
      particlesGeometry.dispose(); // 释放几何体资源
      particleMaterial.dispose(); // 释放材质资源
    };
  }, [analyser]); // 依赖项：音频分析器

  // 渲染挂载元素
  return <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
};

export default Scene3D;