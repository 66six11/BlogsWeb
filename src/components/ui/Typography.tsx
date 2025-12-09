import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const typographyVariants = cva(
  'text-slate-100',
  {
    variants: {
      variant: {
        h1: 'text-4xl font-bold tracking-tight',
        h2: 'text-3xl font-bold tracking-tight',
        h3: 'text-2xl font-bold tracking-tight',
        h4: 'text-xl font-semibold tracking-tight',
        body: 'text-base leading-relaxed',
        caption: 'text-sm text-slate-400',
      },
    },
    defaultVariants: {
      variant: 'body',
    },
  }
);

export interface TypographyProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof typographyVariants> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
}

const getComponentFromVariant = (variant: TypographyProps['variant'], as?: TypographyProps['as']) => {
  if (as) return as;
  
  const variantToElement: Record<string, string> = {
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    caption: 'span',
  };
  
  return variantToElement[variant || 'body'] || 'p';
};

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant, as, ...props }, ref) => {
    const Component = getComponentFromVariant(variant, as);
    
    return React.createElement(
      Component,
      {
        className: cn(typographyVariants({ variant, className })),
        ref,
        ...props,
      }
    );
  }
);

Typography.displayName = 'Typography';

export { Typography, typographyVariants };
