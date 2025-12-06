import React from 'react';
import { Music } from 'lucide-react';
import { HexagramIcon } from './CustomIcons';

interface LoadingScreenProps {
    isVisible: boolean;
    currentTipIndex: number;
    loadingTips: string[];
    resourcesLoaded?: boolean;
    welcomeFading?: boolean;
    onEnter?: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
    isVisible, 
    currentTipIndex, 
    loadingTips,
    resourcesLoaded = false,
    welcomeFading = false,
    onEnter
}) => {
    if (!isVisible) return null;

    return (
        <div 
            className={`fixed inset-0 z-50 welcome-bg flex flex-col items-center justify-center
                transition-opacity ease-out theme-bg-primary ${welcomeFading ? 'opacity-0' : 'opacity-100'}`}
            style={{transitionDuration: '700ms'}}
        >
            <HexagramIcon
                size={80}
                className={`mb-8 animate-pulse transition-all duration-500
                    ${welcomeFading ? 'scale-150 opacity-0' : 'scale-100 opacity-100'}`}
            />
            
            {/* 轮换语句加载动画 - 魔法DEV标题 */}
            <div className={`mb-8 transition-all duration-500
                ${welcomeFading ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'}`}>
                <div className="loading-text-container">
                    <span className="theme-text-accent1 loading-text">
                        {loadingTips[currentTipIndex]}
                    </span>
                </div>
            </div>
            
            <p className={`mb-8 transition-all duration-500 delay-75 theme-text-secondary
                ${welcomeFading ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'}`}>
                点击进入魔法世界
            </p>
            
            {/* 加载指示器 */}
            {!resourcesLoaded && (
                <div className="flex space-x-2 mb-8">
                    <div className="w-3 h-3 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-3 h-3 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-3 h-3 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            )}
            
            {/* 进入按钮 */}
            {resourcesLoaded && !welcomeFading && onEnter && (
                <div className="opacity-100 transition-all duration-700 delay-300" style={{ transitionProperty: 'opacity, transform' }}>
                    <button
                        onClick={onEnter}
                        className={`px-8 py-3 text-white rounded-full 
                            font-bold shadow-[0_0_30px_rgba(222,185,154,0.4)]
                            transition-all duration-500 ease-out flex items-center gap-2
                            relative before:absolute before:inset-0 before:rounded-full
                            before:border-2 before:border-white/10 before:pointer-events-none
                            hover:scale-105 hover:before:border-white/20 welcome-enter-btn
                            translate-y-0 opacity-100 animate-fade-in-up`}
                    >
                        <Music size={20}/> 进入
                    </button>
                </div>
            )}
        </div>
    );
};

export default LoadingScreen;