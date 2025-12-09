import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded font-medium transition-colors',
  {
    variants: {
      variant: {
        category: 'text-xs px-3 py-1 rounded-full border theme-text-accent1 accent-border-light',
        tag: 'text-xs font-mono px-2 py-1 rounded border theme-text-secondary theme-bg-tertiary theme-border-subtle',
        status: 'text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30',
      },
    },
    defaultVariants: {
      variant: 'category',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        className={cn(badgeVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
