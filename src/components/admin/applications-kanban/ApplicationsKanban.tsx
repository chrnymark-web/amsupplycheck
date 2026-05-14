import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  useSupplierApplications,
  useUpdateApplicationStatus,
} from '@/hooks/use-supplier-applications';
import { ApplicationCard } from './ApplicationCard';
import { KanbanColumn } from './KanbanColumn';
import { STAGES, STAGE_IDS, type ApplicationStatus } from './stages';
import { groupByCompany, type CompanyGroup } from './group';

function bucketByStatus(groups: CompanyGroup[]): Record<ApplicationStatus, CompanyGroup[]> {
  const buckets = Object.fromEntries(
    STAGE_IDS.map(id => [id, [] as CompanyGroup[]]),
  ) as Record<ApplicationStatus, CompanyGroup[]>;

  for (const g of groups) {
    if (buckets[g.status]) buckets[g.status].push(g);
    else buckets.pending.push(g);
  }
  return buckets;
}

export function ApplicationsKanban() {
  const { data, isLoading, error } = useSupplierApplications();
  const updateStatus = useUpdateApplicationStatus();
  const { toast } = useToast();
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
  );

  const groups = useMemo(() => groupByCompany(data ?? []), [data]);
  const bucketed = useMemo(() => bucketByStatus(groups), [groups]);
  const activeGroup = useMemo(
    () => (activeKey ? groups.find(g => g.key === activeKey) ?? null : null),
    [activeKey, groups],
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveKey(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveKey(null);
    const { active, over } = event;
    if (!over) return;

    const nextStatus = String(over.id) as ApplicationStatus;
    const currentStatus = active.data.current?.status as ApplicationStatus | undefined;
    const ids = (active.data.current?.ids as string[] | undefined) ?? [];

    if (!STAGE_IDS.includes(nextStatus)) return;
    if (currentStatus === nextStatus) return;
    if (ids.length === 0) return;

    try {
      await updateStatus(ids, nextStatus);
    } catch (e) {
      toast({
        title: 'Could not update status',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  }

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {STAGES.map(stage => (
          <div key={stage.id} className="w-72 shrink-0 space-y-2">
            <Skeleton className="h-8 w-full" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="p-3 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-rose-300">
        Failed to load applications: {error instanceof Error ? error.message : 'unknown'}
      </p>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-3 -mx-2 px-2">
        {STAGES.map(stage => (
          <KanbanColumn key={stage.id} stage={stage} groups={bucketed[stage.id]} />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeGroup ? (
          <div className="w-72">
            <ApplicationCard group={activeGroup} isDragOverlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
