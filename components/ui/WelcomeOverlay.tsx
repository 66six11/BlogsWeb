import React from 'react';
import { Music } from 'lucide-react';
import { APP_TITLE } from '../../constants';
import { HexagramIcon } from '../CustomIcons';

interface WelcomeOverlayProps {
  showWelcome: boolean;
  welcomeFading: boolean;
  onEnter: () => void;
  transitionDuration: number;
}

export const WelcomeOverlay: React.FC<WelcomeOverlayProps> = ({
  showWelcome,
  welcomeFading,
  onEnter,
  transitionDuration
}) => {
  if (!showWelcome) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center
                  transition-opacity ease-out ${welcomeFading ? 'opacity-0' : 'opacity-100'}`}
      style={{ transitionDuration: `${transitionDuration}ms` }}
    >
      <HexagramIcon 
        size={80} 
        className={`mb-8 animate-pulse transition-all duration-500
                    ${welcomeFading ? 'scale-150 opacity-0' : 'scale-100 opacity-100'}`} 
      />
      <h1 className={`text-4xl font-serif font-bold text-white mb-4 transition-all duration-500
                     ${welcomeFading ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'}`}>
        {APP_TITLE}
      </h1>
      <p className={`text-slate-400 mb-8 transition-all duration-500 delay-75
                    ${welcomeFading ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'}`}>
        点击进入魔法世界
      </p>
      <button
        onClick={onEnter}
        className={`px-8 py-3 bg-gradient-to-r from-purple-600 to-amber-500 text-white rounded-full 
                   font-bold shadow-[0_0_30px_rgba(251,191,36,0.4)] hover:scale-105 
                   transition-all duration-500 delay-100 flex items-center gap-2 border border-white/20
                   ${welcomeFading ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'}`}
      >
        <Music size={20} /> 进入
      </button>
    </div>
  );
};

export default WelcomeOverlay;
