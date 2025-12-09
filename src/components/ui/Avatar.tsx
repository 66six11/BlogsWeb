import React from 'react';
import { cn } from '../../lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withGlow?: boolean;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt = 'Avatar', size = 'md', withGlow = true, ...props }, ref) => {
    const sizeClasses = {
      sm: 'w-16 h-16',
      md: 'w-32 h-32',
      lg: 'w-48 h-48',
      xl: 'w-64 h-64',
    }[size];

    return (
      <div
        ref={ref}
        className={cn('relative', sizeClasses, className)}
        {...props}
      >
        {withGlow && (
          <div className="absolute inset-0 rounded-full animate-spin-slow opacity-80 blur-md group-hover:blur-xl transition-all avatar-gradient-bg" />
        )}
        <img
          src={src}
          alt={alt}
          className="w-full h-full rounded-full border-4 relative z-10 object-cover hover:scale-105 transition-transform avatar-border"
        />
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };
