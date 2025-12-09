import React from 'react';
import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'centered';
}

const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ className, title, description, icon: Icon, variant = 'centered', ...props }, ref) => {
    const isCentered = variant === 'centered';

    return (
      <div
        ref={ref}
        className={cn(
          'p-6 rounded-2xl backdrop-blur-sm border opacity-80 theme-bg-secondary theme-border-subtle',
          isCentered && 'text-center',
          className
        )}
        {...props}
      >
        <h2
          className={cn(
            'text-3xl md:text-4xl font-serif font-bold mb-2 theme-text-primary',
            isCentered && 'flex items-center justify-center gap-3'
          )}
        >
          {Icon && <Icon size={30} className="theme-text-accent1" />}
          {title}
        </h2>
        {description && (
          <p className="theme-text-secondary">{description}</p>
        )}
      </div>
    );
  }
);

SectionHeader.displayName = 'SectionHeader';

export { SectionHeader };
