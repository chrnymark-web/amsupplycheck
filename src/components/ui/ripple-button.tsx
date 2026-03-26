import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useRipple } from '@/hooks/use-ripple';

const RippleButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, onClick, className, ...props }, ref) => {
    const { addRipple, rippleElements } = useRipple();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      addRipple(e);
      onClick?.(e);
    };

    return (
      <Button
        ref={ref}
        onClick={handleClick}
        className={`relative overflow-hidden ${className}`}
        {...props}
      >
        {children}
        {rippleElements}
      </Button>
    );
  }
);

RippleButton.displayName = 'RippleButton';

export { RippleButton };
