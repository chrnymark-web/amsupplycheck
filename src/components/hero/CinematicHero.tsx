import * as React from 'react';
import { useEffect, useRef } from 'react';

interface CinematicHeroProps {
  children?: React.ReactNode;
  className?: string;
}

const grainDataUri =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.85'/></svg>\")";

const veilBackground =
  'radial-gradient(ellipse at 50% 30%, transparent 0%, hsl(var(--background) / 0.35) 60%, hsl(var(--background) / 0.85) 100%),' +
  'linear-gradient(180deg, hsl(var(--background) / 0.55) 0%, hsl(var(--background) / 0.15) 35%, hsl(var(--background) / 0.65) 80%, hsl(var(--background)) 100%)';

export const CinematicHero: React.FC<CinematicHeroProps> = ({ children, className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const tryPlay = () => {
      v.play().catch(() => {});
    };
    v.addEventListener('canplay', tryPlay, { once: true });
    const onVis = () => {
      if (!document.hidden) tryPlay();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      v.removeEventListener('canplay', tryPlay);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <section
      id="hero"
      className={`cinematic-hero relative min-h-[68svh] overflow-hidden ${className ?? ''}`}
      style={{ background: 'hsl(var(--background))' }}
    >
      <video
        ref={videoRef}
        className="bg-video absolute inset-0 w-full h-full object-cover z-0"
        src="/hero-printer.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
        style={{ filter: 'brightness(0.28) saturate(0.85) contrast(1.05)' }}
      />

      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{ background: veilBackground }}
      />

      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          backgroundImage: grainDataUri,
          opacity: 0.06,
          mixBlendMode: 'overlay',
        }}
      />

      <div className="relative z-10">{children}</div>
    </section>
  );
};

export default CinematicHero;
