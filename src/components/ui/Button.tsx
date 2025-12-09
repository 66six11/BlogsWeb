import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'px-8 py-3 text-white rounded-lg font-bold shadow-[0_0_20px_rgba(124,133,235,0.4)] transition-all hover:scale-105 hover:opacity-90 flex items-center gap-2 border backdrop-blur-sm theme-btn-primary accent3-border',
        secondary: 'px-8 py-3 rounded-lg font-bold border transition-all hover:scale-105 flex items-center gap-2 backdrop-blur-md hover:bg-white/10 theme-text-primary theme-border-subtle bg-white/10',
        ghost: 'hover:bg-white/5 theme-text-secondary transition-all duration-300',
        icon: 'p-1.5 hover:bg-white/10 rounded-full transition-colors theme-text-secondary',
      },
      size: {
        sm: 'text-sm px-3 py-1.5',
        md: 'text-base px-4 py-2',
        lg: 'text-lg px-8 py-3',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
