import { useDraggable } from '@dnd-kit/core';
import { MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CompanyGroup } from './group';
import type { Temperature } from '@/hooks/use-supplier-applications';

type Props = {
  group: CompanyGroup;
  isDragOverlay?: boolean;
  onOpen?: (group: CompanyGroup) => void;
};

const TEMP_STRIPE: Record<Temperature, string> = {
  hot: 'bg-rose-500/80',
  warm: 'bg-amber-500/80',
  cold: 'bg-cyan-500/80',
};

const USD_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function daysBetween(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function formatStageAge(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return '1d in stage';
  return `${days}d in stage`;
}

function formatApplied(days: number): string {
  if (days === 0) return 'applied today';
  if (days === 1) return 'applied 1d ago';
  return `applied ${days}d ago`;
}

export function ApplicationCard({ group, isDragOverlay = false, onOpen }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: group.key,
    data: { status: group.status, ids: group.ids },
  });

  const stageDays = daysBetween(group.lastStatusAt);
  const appliedDays = daysBetween(group.firstAppliedAt);
  const stagnant = stageDays >= 7;
  const hasNotes = !!group.notes?.trim();

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  function handleClick() {
    if (isDragging || isDragOverlay) return;
    onOpen?.(group);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={cn(
        'touch-none select-none',
        isDragging && !isDragOverlay && 'opacity-30',
      )}
    >
      <Card
        className={cn(
          'relative overflow-hidden bg-card border-border transition-shadow',
          isDragOverlay
            ? 'shadow-2xl shadow-black/50 ring-1 ring-white/10 rotate-1 cursor-grabbing'
            : 'hover:border-border/80 hover:shadow-md hover:shadow-black/30 cursor-grab active:cursor-grabbing',
        )}
      >
        {group.temperature && (
          <span
            aria-hidden
            className={cn('absolute left-0 top-0 bottom-0 w-1', TEMP_STRIPE[group.temperature])}
          />
        )}
        <CardContent className={cn('p-3 space-y-2', group.temperature && 'pl-4')}>
          <div className="space-y-0.5">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-foreground text-sm leading-tight">{group.company}</h4>
              <div className="flex items-center gap-1 shrink-0">
                {group.estimatedValueUsd != null && group.estimatedValueUsd > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 h-5 font-medium border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-200/90"
                  >
                    {USD_FORMAT.format(group.estimatedValueUsd)}
                  </Badge>
                )}
                {group.count > 1 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 h-5 font-normal border-foreground/20 text-foreground/80"
                    title={`${group.count} applications from this company`}
                  >
                    ×{group.count}
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground truncate">{group.contactName}</p>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-[10px] text-muted-foreground/80 flex items-center gap-1">
              {formatApplied(appliedDays)}
              {hasNotes && <MessageSquare className="h-3 w-3 text-muted-foreground/60" />}
            </span>
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] px-1.5 py-0 h-5 font-normal',
                stagnant && 'border-rose-500/30 text-rose-300/90',
              )}
            >
              {formatStageAge(stageDays)}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
