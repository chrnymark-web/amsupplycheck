import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Filter, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { CrmPipelineStage, CrmDeal } from "@/types/crm";

interface CrmBoardHeaderProps {
  stages: CrmPipelineStage[];
  deals: CrmDeal[];
  showFilters: boolean;
  onToggleFilters: () => void;
  onCreateDeal: () => void;
}

export function CrmBoardHeader({
  stages,
  deals,
  showFilters,
  onToggleFilters,
  onCreateDeal,
}: CrmBoardHeaderProps) {
  const navigate = useNavigate();

  const stageCounts = stages.map((s) => ({
    name: s.name,
    color: s.color,
    count: deals.filter((d) => d.stage_id === s.id).length,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/data-overview")}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Admin
          </Button>
          <div>
            <h1 className="text-2xl font-bold">CRM Pipeline</h1>
            <p className="text-sm text-muted-foreground">
              {deals.length} active deal{deals.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={onToggleFilters}
          >
            <Filter className="mr-1 h-4 w-4" />
            Filters
          </Button>
          <Button size="sm" onClick={onCreateDeal}>
            <Plus className="mr-1 h-4 w-4" />
            New Deal
          </Button>
        </div>
      </div>

      {/* Stage summary */}
      <div className="flex gap-2 flex-wrap">
        {stageCounts.map((s) => (
          <Badge
            key={s.name}
            variant="outline"
            className="text-xs gap-1.5"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            {s.name}: {s.count}
          </Badge>
        ))}
      </div>
    </div>
  );
}
