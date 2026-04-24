import * as React from 'react';

interface CinematicHeroProps {
  children?: React.ReactNode;
  className?: string;
}

export const CinematicHero: React.FC<CinematicHeroProps> = ({ children, className }) => {
  return (
    <section
      id="hero"
      className={`cinematic-hero relative min-h-[68svh] overflow-hidden ${className ?? ''}`}
    >
      <div className="relative z-10">{children}</div>
    </section>
  );
};

export default CinematicHero;
