import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { ApplicationCard } from './ApplicationCard';
import type { StageConfig } from './stages';
import type { SupplierApplication } from '@/hooks/use-supplier-applications';

type Props = {
  stage: StageConfig;
  applications: SupplierApplication[];
};

export function KanbanColumn({ stage, applications }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: { stage: stage.id },
  });

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
        <span className="text-xs font-medium opacity-70 tabular-nums">{applications.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 min-h-32 p-2 space-y-2 transition-colors',
          isOver && 'bg-foreground/[0.03]',
        )}
      >
        {applications.length === 0 ? (
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
          applications.map(app => <ApplicationCard key={app.id} app={app} />)
        )}
      </div>
    </div>
  );
}
