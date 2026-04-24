import * as React from 'react';
import { cn } from '@/lib/utils';

export type GlassButtonVariant = 'sm' | 'lg';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GlassButtonVariant;
}

const variantClasses: Record<GlassButtonVariant, string> = {
  sm: 'px-[22px] py-[10px] text-[13.5px]',
  lg: 'px-[50px] py-[18px] text-[15px] tracking-[-0.005em]',
};

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ variant = 'sm', className, type = 'button', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn('liquid-glass', variantClasses[variant], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
GlassButton.displayName = 'GlassButton';

export default GlassButton;
