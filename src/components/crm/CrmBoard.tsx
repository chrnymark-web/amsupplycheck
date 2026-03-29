import { useState, useMemo, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useQueryClient } from "@tanstack/react-query";
import { CrmColumn } from "./CrmColumn";
import { CrmCard } from "./CrmCard";
import { CrmBoardHeader } from "./CrmBoardHeader";
import { CrmFiltersBar } from "./CrmFilters";
import { CrmCardDetail } from "./CrmCardDetail";
import { CrmCreateDealDialog } from "./CrmCreateDealDialog";
import { useCrmStages, useCrmDeals, useMoveDeal, useReorderDeal } from "@/hooks/use-crm";
import { useCrmRealtime } from "@/hooks/use-crm-realtime";
import type { CrmDeal, CrmFilters } from "@/types/crm";

export function CrmBoard() {
  const [filters, setFilters] = useState<CrmFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<CrmDeal | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: stages = [], isLoading: stagesLoading } = useCrmStages();
  const { data: deals = [], isLoading: dealsLoading } = useCrmDeals(filters);
  const moveDeal = useMoveDeal();
  const reorderDeal = useReorderDeal();
  const qc = useQueryClient();

  // Realtime
  useCrmRealtime(selectedDeal?.id);

  // Group deals by stage
  const dealsByStage = useMemo(() => {
    const map = new Map<string, CrmDeal[]>();
    stages.forEach((s) => map.set(s.id, []));
    deals.forEach((d) => {
      const arr = map.get(d.stage_id);
      if (arr) arr.push(d);
    });
    // Sort each column by position
    map.forEach((arr) => arr.sort((a, b) => a.position - b.position));
    return map;
  }, [stages, deals]);

  // Drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const activeDeal = activeId ? deals.find((d) => d.id === activeId) : null;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over) return;

      const draggedDeal = deals.find((d) => d.id === active.id);
      if (!draggedDeal) return;

      // Determine target stage
      let targetStageId: string;
      let targetStageName: string;

      if (over.data.current?.type === "column") {
        targetStageId = over.data.current.stageId;
        targetStageName = over.data.current.stageName;
      } else if (over.data.current?.type === "deal") {
        const overDeal = over.data.current.deal as CrmDeal;
        targetStageId = overDeal.stage_id;
        targetStageName = stages.find((s) => s.id === overDeal.stage_id)?.name || "";
      } else {
        return;
      }

      const sourceStageId = draggedDeal.stage_id;
      const fromStageName = stages.find((s) => s.id === sourceStageId)?.name || "";

      // Calculate new position
      const targetDeals = dealsByStage.get(targetStageId) || [];
      let newPosition: number;

      if (over.data.current?.type === "deal") {
        const overDeal = over.data.current.deal as CrmDeal;
        const overIndex = targetDeals.findIndex((d) => d.id === overDeal.id);
        if (overIndex === 0) {
          newPosition = overDeal.position - 500;
        } else {
          const prevDeal = targetDeals[overIndex - 1];
          newPosition = Math.floor(
            (prevDeal.position + overDeal.position) / 2
          );
        }
      } else {
        // Dropped on empty column or at end
        const lastDeal = targetDeals[targetDeals.length - 1];
        newPosition = lastDeal ? lastDeal.position + 1000 : 1000;
      }

      // Optimistic update
      qc.setQueryData(["crm-deals", filters], (old: CrmDeal[] | undefined) => {
        if (!old) return old;
        return old.map((d) =>
          d.id === draggedDeal.id
            ? { ...d, stage_id: targetStageId, position: newPosition }
            : d
        );
      });

      if (sourceStageId !== targetStageId) {
        moveDeal.mutate({
          dealId: draggedDeal.id,
          newStageId: targetStageId,
          newPosition,
          fromStageName,
          toStageName: targetStageName,
        });
      } else {
        reorderDeal.mutate({
          dealId: draggedDeal.id,
          newPosition,
        });
      }
    },
    [deals, stages, dealsByStage, filters, qc, moveDeal, reorderDeal]
  );

  const handleCardClick = useCallback((deal: CrmDeal) => {
    // Refresh the deal from the latest data
    setSelectedDeal(deal);
  }, []);

  const isLoading = stagesLoading || dealsLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="p-4 md:p-6 space-y-4">
        <CrmBoardHeader
          stages={stages}
          deals={deals}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          onCreateDeal={() => setShowCreate(true)}
        />

        {showFilters && (
          <CrmFiltersBar filters={filters} onChange={setFilters} />
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading pipeline...</p>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-200px)]">
              {stages.map((stage) => (
                <CrmColumn
                  key={stage.id}
                  stage={stage}
                  deals={dealsByStage.get(stage.id) || []}
                  onCardClick={handleCardClick}
                />
              ))}
            </div>

            <DragOverlay>
              {activeDeal ? (
                <CrmCard
                  deal={activeDeal}
                  onClick={() => {}}
                  isDragOverlay
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Detail panel */}
      <CrmCardDetail
        deal={selectedDeal}
        open={!!selectedDeal}
        onOpenChange={(open) => {
          if (!open) setSelectedDeal(null);
        }}
      />

      {/* Create dialog */}
      <CrmCreateDealDialog
        open={showCreate}
        onOpenChange={setShowCreate}
      />
    </div>
  );
}
