import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CrmCard } from "./CrmCard";
import { CrmEmptyState } from "./CrmEmptyState";
import type { CrmDeal, CrmPipelineStage } from "@/types/crm";

interface CrmColumnProps {
  stage: CrmPipelineStage;
  deals: CrmDeal[];
  onCardClick: (deal: CrmDeal) => void;
}

export function CrmColumn({ stage, deals, onCardClick }: CrmColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${stage.id}`,
    data: { type: "column", stageId: stage.id, stageName: stage.name },
  });

  return (
    <div className="flex flex-col w-72 min-w-[288px] shrink-0">
      {/* Column header */}
      <div className="flex items-center gap-2 px-2 py-2 mb-2">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: stage.color }}
        />
        <h3 className="text-sm font-semibold truncate">{stage.name}</h3>
        <span className="text-xs text-muted-foreground ml-auto bg-muted px-1.5 py-0.5 rounded-full">
          {deals.length}
        </span>
      </div>

      {/* Droppable card list */}
      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 p-1 rounded-lg min-h-[200px] transition-colors ${
          isOver ? "bg-primary/10 ring-2 ring-primary/30" : "bg-muted/30"
        }`}
      >
        <SortableContext
          items={deals.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          {deals.length === 0 ? (
            <CrmEmptyState />
          ) : (
            deals.map((deal) => (
              <CrmCard
                key={deal.id}
                deal={deal}
                onClick={() => onCardClick(deal)}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
