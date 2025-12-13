/**
 * 加载界面组件 - 应用启动时的欢迎和加载状态显示
 * @file src/components/common/LoadingScreen.tsx
 * @description 显示应用加载过程中的欢迎界面，包括动态文字效果、加载指示器和进入按钮
 * @created 2025-12-13
 */

import React from 'react';
import { Music } from 'lucide-react';
import { HexagramIcon } from '../icons/CustomIcons';
import { WaveText } from '../features/content/WaveText';

/**
 * 加载界面组件属性接口
 * @interface LoadingScreenProps
 * @description 定义了加载界面组件的输入属性
 */
interface LoadingScreenProps {
    isVisible: boolean;          // 加载界面是否可见
    currentTipIndex: number;     // 当前显示的提示索引
    loadingTips: string[];       // 加载提示数组
    resourcesLoaded?: boolean;   // 资源是否加载完成（可选，默认false）
    welcomeFading?: boolean;     // 欢迎界面是否正在淡出（可选，默认false）
    onEnter?: () => void;        // 进入应用的回调函数（可选）
}

/**
 * 加载界面组件
 * @component LoadingScreen
 * @description 应用启动时显示的欢迎和加载界面，包含动态文字效果、加载指示器和进入按钮
 */
const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
    isVisible,       // 加载界面是否可见
    currentTipIndex,  // 当前显示的提示索引
    loadingTips,      // 加载提示数组
    resourcesLoaded = false,  // 资源是否加载完成
    welcomeFading = false,    // 欢迎界面是否正在淡出
    onEnter                   // 进入应用的回调函数
}) => {
    // 如果不可见，直接返回null，不渲染任何内容
    if (!isVisible) return null;

    return (
        <div 
            className={`fixed inset-0 z-50 welcome-bg flex flex-col items-center justify-center
                transition-opacity ease-out theme-bg-primary ${welcomeFading ? 'opacity-0' : 'opacity-100'}`}
            style={{transitionDuration: '700ms'}}
        >
            {/* 六芒星图标 - 应用标志 */}
            <HexagramIcon
                size={80}
                className={`mb-8 animate-pulse transition-all duration-500
                    ${welcomeFading ? 'scale-150 opacity-0' : 'scale-100 opacity-100'}`}
            />
            
            {/* 轮换提示文字 - 使用 WaveText 组件实现波浪文字效果 */}
            <div className={`mb-8 transition-all duration-500
                ${welcomeFading ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'}`}>
                <WaveText 
                    texts={loadingTips}
                    appearDelay={100}
                    displayDuration={2000}
                    fadeDelay={80}
                    loopDelay={500}
                    distance={30}
                    className="theme-text-accent1 text-2xl md:text-xl"
                />
            </div>
          
            {/* 加载指示器 - 仅在资源未加载完成时显示 */}
            {!resourcesLoaded && (
                <div className="flex space-x-2 mb-8">
                    <div className="w-3 h-3 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-3 h-3 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-3 h-3 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            )}
            
            {/* 进入按钮 - 仅在资源加载完成且界面未淡出时显示 */}
            {resourcesLoaded && !welcomeFading && onEnter && (
                <div className="opacity-100 transition-all duration-700 delay-300" style={{ transitionProperty: 'opacity, transform' }}>
                    <button
                        onClick={onEnter}  // 点击触发进入应用回调
                        className={`px-8 py-3 text-white rounded-full 
                            font-bold shadow-[0_0_30px_rgba(222,185,154,0.4)]
                            transition-all duration-500 ease-out flex items-center gap-2
                            relative before:absolute before:inset-0 before:rounded-full
                            before:border-2 before:border-white/10 before:pointer-events-none
                            hover:scale-105 hover:before:border-white/20 welcome-enter-btn
                            translate-y-0 opacity-100 animate-fade-in-up`}>
                        <Music size={20}/> 进入
                    </button>
                </div>
            )}
        </div>
    );
};

export default LoadingScreen;