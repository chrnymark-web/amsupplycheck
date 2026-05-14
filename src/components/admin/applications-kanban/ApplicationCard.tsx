import { useDraggable } from '@dnd-kit/core';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CompanyGroup } from './group';

type Props = {
  group: CompanyGroup;
  isDragOverlay?: boolean;
};

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

export function ApplicationCard({ group, isDragOverlay = false }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: group.key,
    data: { status: group.status, ids: group.ids },
  });

  const stageDays = daysBetween(group.lastStatusAt);
  const appliedDays = daysBetween(group.firstAppliedAt);
  const stagnant = stageDays >= 7;

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'touch-none select-none',
        isDragging && !isDragOverlay && 'opacity-30',
      )}
    >
      <Card
        className={cn(
          'bg-card border-border transition-shadow',
          isDragOverlay
            ? 'shadow-2xl shadow-black/50 ring-1 ring-white/10 rotate-1 cursor-grabbing'
            : 'hover:border-border/80 hover:shadow-md hover:shadow-black/30 cursor-grab active:cursor-grabbing',
        )}
      >
        <CardContent className="p-3 space-y-2">
          <div className="space-y-0.5">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-foreground text-sm leading-tight">{group.company}</h4>
              {group.count > 1 && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-5 font-normal shrink-0 border-foreground/20 text-foreground/80"
                  title={`${group.count} applications from this company`}
                >
                  ×{group.count}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{group.contactName}</p>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-[10px] text-muted-foreground/80">{formatApplied(appliedDays)}</span>
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
