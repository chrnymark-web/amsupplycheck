import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { ApplicationCard } from './ApplicationCard';
import type { StageConfig } from './stages';
import type { CompanyGroup } from './group';

type Props = {
  stage: StageConfig;
  groups: CompanyGroup[];
  onOpenCard?: (group: CompanyGroup) => void;
};

const USD_COMPACT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

function totalValue(groups: CompanyGroup[]): number {
  let sum = 0;
  for (const g of groups) {
    if (g.estimatedValueUsd && g.estimatedValueUsd > 0) sum += g.estimatedValueUsd;
  }
  return sum;
}

export function KanbanColumn({ stage, groups, onOpenCard }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: { stage: stage.id },
  });

  const value = totalValue(groups);

  return (
    <div className="flex flex-col w-72 shrink-0 rounded-xl bg-card/40 border border-border">
      <div
        className={cn(
          'flex items-center justify-between px-3 py-2 rounded-t-xl border-b border-border',
          stage.headerClass,
        )}
      >
        <div className="flex items-center gap-2">
          <span className={cn('h-1.5 w-1.5 rounded-full', stage.dotClass)} />
          <span className="text-xs font-semibold tracking-wide uppercase">{stage.label}</span>
        </div>
        <div className="flex items-center gap-2 text-xs opacity-70 tabular-nums">
          <span>{groups.length}</span>
          {value > 0 && (
            <>
              <span className="opacity-50">·</span>
              <span className="font-medium">{USD_COMPACT.format(value)}</span>
            </>
          )}
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 min-h-32 p-2 space-y-2 transition-colors',
          isOver && 'bg-foreground/[0.03]',
        )}
      >
        {groups.length === 0 ? (
          <div
            className={cn(
              'h-24 rounded-lg border border-dashed border-border/60 flex items-center justify-center transition-colors',
              isOver && 'border-foreground/30',
            )}
          >
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
              {isOver ? 'Drop here' : 'Empty'}
            </span>
          </div>
        ) : (
          groups.map(group => (
            <ApplicationCard key={group.key} group={group} onOpen={onOpenCard} />
          ))
        )}
      </div>
    </div>
  );
}
