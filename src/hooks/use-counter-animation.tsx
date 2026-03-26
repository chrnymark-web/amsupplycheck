import { useEffect, useState, useRef } from 'react';

interface UseCounterAnimationProps {
  end: number;
  duration?: number;
  start?: number;
}

export const useCounterAnimation = ({ 
  end, 
  duration = 2000, 
  start = 0 
}: UseCounterAnimationProps) => {
  const [count, setCount] = useState(start);

  useEffect(() => {
    if (end === 0) return;

    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * (end - start) + start));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [end, duration, start]);

  return count;
};

// New hook that animates from previous value to new value
export const useAnimatedCount = (value: number, duration = 300) => {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);

  useEffect(() => {
    if (value === previousValue.current) return;

    const startValue = previousValue.current;
    const endValue = value;
    let startTimestamp: number | null = null;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.round(startValue + (endValue - startValue) * easeOutQuart);
      setDisplayValue(currentValue);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        previousValue.current = value;
      }
    };

    window.requestAnimationFrame(step);
  }, [value, duration]);

  return displayValue;
};
