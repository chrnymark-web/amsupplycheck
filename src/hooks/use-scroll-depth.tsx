import { useEffect, useRef } from 'react';
import { trackScrollDepth } from '@/lib/analytics';

type ScrollMilestone = 25 | 50 | 75 | 90 | 100;

export const useScrollDepth = () => {
  const trackedMilestones = useRef<Set<ScrollMilestone>>(new Set());

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      
      const scrollPercentage = ((scrollTop + windowHeight) / documentHeight) * 100;

      const milestones: ScrollMilestone[] = [25, 50, 75, 90, 100];
      
      milestones.forEach((milestone) => {
        if (scrollPercentage >= milestone && !trackedMilestones.current.has(milestone)) {
          trackedMilestones.current.add(milestone);
          trackScrollDepth(milestone);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Check initial scroll position
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
};
