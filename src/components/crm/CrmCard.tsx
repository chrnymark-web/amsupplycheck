import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CrmLabelBadge } from "./CrmLabelBadge";
import { Calendar, User } from "lucide-react";
import { format } from "date-fns";
import type { CrmDeal } from "@/types/crm";

interface CrmCardProps {
  deal: CrmDeal;
  onClick: () => void;
  isDragOverlay?: boolean;
}

export function CrmCard({ deal, onClick, isDragOverlay }: CrmCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: deal.id,
    data: { type: "deal", deal },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <Card
      ref={!isDragOverlay ? setNodeRef : undefined}
      style={!isDragOverlay ? style : undefined}
      className={`p-3 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors bg-card ${
        isDragOverlay ? "shadow-lg rotate-2 border-primary" : ""
      }`}
      onClick={(e) => {
        // Don't open detail if we're dragging
        if (!(e.target as HTMLElement).closest("[data-no-click]")) {
          onClick();
        }
      }}
      {...(!isDragOverlay ? { ...attributes, ...listeners } : {})}
    >
      <div className="space-y-2">
        <p className="text-sm font-medium leading-tight truncate">{deal.title}</p>

        <p className="text-xs text-muted-foreground truncate">
          {deal.contact_email}
        </p>

        {/* Labels */}
        {deal.labels && deal.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {deal.labels.map((label) => (
              <CrmLabelBadge key={label.id} label={label} />
            ))}
          </div>
        )}

        {/* Tech / Material badges */}
        <div className="flex flex-wrap gap-1">
          {deal.technology && (
            <Badge variant="outline" className="text-[10px] px-1 py-0">
              {deal.technology}
            </Badge>
          )}
          {deal.material && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0">
              {deal.material}
            </Badge>
          )}
        </div>

        {/* Footer: due date + assignee */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          {deal.due_date ? (
            <span className="flex items-center gap-0.5">
              <Calendar className="h-3 w-3" />
              {format(new Date(deal.due_date), "MMM d")}
            </span>
          ) : (
            <span />
          )}
          {deal.assigned_to && (
            <span className="flex items-center gap-0.5">
              <User className="h-3 w-3" />
              Assigned
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
