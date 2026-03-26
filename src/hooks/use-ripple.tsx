import { useState, useCallback } from 'react';

interface Ripple {
  x: number;
  y: number;
  size: number;
  id: number;
}

export const useRipple = () => {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const addRipple = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    const newRipple = {
      x,
      y,
      size,
      id: Date.now(),
    };

    setRipples((prevRipples) => [...prevRipples, newRipple]);

    // Remove ripple after animation completes
    setTimeout(() => {
      setRipples((prevRipples) => prevRipples.filter((r) => r.id !== newRipple.id));
    }, 600);
  }, []);

  const rippleElements = ripples.map((ripple) => (
    <span
      key={ripple.id}
      className="absolute rounded-full bg-white/30 pointer-events-none animate-ripple"
      style={{
        left: ripple.x,
        top: ripple.y,
        width: ripple.size,
        height: ripple.size,
      }}
    />
  ));

  return { addRipple, rippleElements };
};
