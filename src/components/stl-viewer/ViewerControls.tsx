import { RotateCcw, Grid3x3, Ruler, Box, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ViewerControlsProps {
  wireframe: boolean;
  onToggleWireframe: () => void;
  onResetView: () => void;
  showDimensions: boolean;
  onToggleDimensions: () => void;
  dimensions?: { x: number; y: number; z: number };
  volumeCm3?: number;
  className?: string;
}

export function ViewerControls({
  wireframe,
  onToggleWireframe,
  onResetView,
  showDimensions,
  onToggleDimensions,
  dimensions,
  volumeCm3,
  className,
}: ViewerControlsProps) {
  return (
    <>
      {/* Top-right: dimensions readout */}
      {showDimensions && dimensions && (
        <div
          className={cn(
            'absolute top-3 right-3 pointer-events-auto',
            'rounded-lg border border-white/10 bg-black/50 backdrop-blur-md',
            'px-3 py-2 text-[11px] font-mono text-white/90',
            'shadow-[0_8px_32px_hsl(87,20%,45%,0.15)]'
          )}
        >
          <div className="flex items-center gap-3">
            <div>
              <span className="text-white/50">X </span>
              {dimensions.x.toFixed(1)}
              <span className="text-white/40 ml-0.5">mm</span>
            </div>
            <div>
              <span className="text-white/50">Y </span>
              {dimensions.y.toFixed(1)}
              <span className="text-white/40 ml-0.5">mm</span>
            </div>
            <div>
              <span className="text-white/50">Z </span>
              {dimensions.z.toFixed(1)}
              <span className="text-white/40 ml-0.5">mm</span>
            </div>
            {volumeCm3 !== undefined && (
              <div className="border-l border-white/20 pl-3">
                <span className="text-white/50">V </span>
                {volumeCm3.toFixed(1)}
                <span className="text-white/40 ml-0.5">cm³</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom-left: action buttons */}
      <div
        className={cn(
          'absolute bottom-3 left-3 pointer-events-none',
          'flex items-center gap-1.5',
          className
        )}
      >
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <ControlButton
            icon={<RotateCcw className="h-3.5 w-3.5" />}
            label="Reset"
            onClick={onResetView}
          />
          <ControlButton
            icon={<Box className="h-3.5 w-3.5" />}
            label="Wireframe"
            active={wireframe}
            onClick={onToggleWireframe}
          />
          <ControlButton
            icon={<Ruler className="h-3.5 w-3.5" />}
            label="Dimensions"
            active={showDimensions}
            onClick={onToggleDimensions}
          />
        </div>
      </div>
    </>
  );
}

function ControlButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'group flex items-center gap-1.5 rounded-lg px-2.5 py-1.5',
        'border backdrop-blur-md',
        'text-[11px] font-medium',
        'transition-[background-color,border-color,color,transform] duration-200',
        'hover:scale-[1.02] active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0',
        active
          ? 'border-primary/40 bg-primary/15 text-primary'
          : 'border-white/10 bg-black/50 text-white/70 hover:border-white/20 hover:bg-black/60 hover:text-white'
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
