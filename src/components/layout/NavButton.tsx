import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface NavButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
}

const NavButton = React.forwardRef<HTMLButtonElement, NavButtonProps>(
  ({ icon: Icon, label, isActive, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all duration-300 text-sm font-semibold',
          isActive
            ? 'bg-white/10 shadow-[0_0_10px_rgba(255,255,255,0.1)] border'
            : 'hover:bg-white/5 theme-text-secondary',
          className
        )}
        {...props}
      >
        <Icon size={15} />
        {label}
      </button>
    );
  }
);

NavButton.displayName = 'NavButton';

export { NavButton };
