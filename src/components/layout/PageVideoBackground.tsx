import * as React from 'react';
import { useEffect, useRef } from 'react';

const grainDataUri =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.85'/></svg>\")";

const veilBackground =
  'linear-gradient(180deg, hsl(var(--background) / 0.55) 0%, hsl(var(--background) / 0.7) 100%)';

const PageVideoBackground: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = 0.7;
    const tryPlay = () => {
      v.playbackRate = 0.7;
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
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
      style={{ background: 'hsl(var(--background))' }}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        src="/hero-printer.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        style={{ filter: 'brightness(0.28) saturate(0.85) contrast(1.05)' }}
      />
      <div className="absolute inset-0" style={{ background: veilBackground }} />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: grainDataUri,
          opacity: 0.06,
          mixBlendMode: 'overlay',
        }}
      />
    </div>
  );
};

export default PageVideoBackground;
