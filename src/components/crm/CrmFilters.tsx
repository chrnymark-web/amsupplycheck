import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { useCrmLabels } from "@/hooks/use-crm";
import type { CrmFilters as Filters } from "@/types/crm";

interface CrmFiltersBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

const TECHNOLOGIES = [
  "FDM", "SLA", "SLS", "MJF", "CNC Machining", "DLP", "DMLS",
  "Injection Molding", "SLM", "PolyJet",
];

const MATERIALS = [
  "PLA", "ABS", "PETG", "Nylon", "Resin", "Aluminum", "Stainless Steel",
  "Titanium", "Copper", "PC (Polycarbonate)",
];

export function CrmFiltersBar({ filters, onChange }: CrmFiltersBarProps) {
  const { data: labels } = useCrmLabels();

  const hasActiveFilters = !!(
    filters.search ||
    filters.technology ||
    filters.material ||
    (filters.labelIds && filters.labelIds.length > 0) ||
    filters.assignedTo
  );

  return (
    <div className="flex flex-wrap gap-2 items-center p-3 bg-muted/30 rounded-lg">
      <Input
        placeholder="Search deals..."
        value={filters.search || ""}
        onChange={(e) => onChange({ ...filters, search: e.target.value || undefined })}
        className="w-48 h-8 text-sm"
      />

      <Select
        value={filters.technology || "all"}
        onValueChange={(v) => onChange({ ...filters, technology: v === "all" ? undefined : v })}
      >
        <SelectTrigger className="w-36 h-8 text-sm">
          <SelectValue placeholder="Technology" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Technologies</SelectItem>
          {TECHNOLOGIES.map((t) => (
            <SelectItem key={t} value={t}>{t}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.material || "all"}
        onValueChange={(v) => onChange({ ...filters, material: v === "all" ? undefined : v })}
      >
        <SelectTrigger className="w-36 h-8 text-sm">
          <SelectValue placeholder="Material" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Materials</SelectItem>
          {MATERIALS.map((m) => (
            <SelectItem key={m} value={m}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.labelIds?.[0] || "all"}
        onValueChange={(v) =>
          onChange({ ...filters, labelIds: v === "all" ? undefined : [v] })
        }
      >
        <SelectTrigger className="w-32 h-8 text-sm">
          <SelectValue placeholder="Label" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Labels</SelectItem>
          {(labels || []).map((l) => (
            <SelectItem key={l.id} value={l.id}>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                {l.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          onClick={() => onChange({})}
        >
          <X className="mr-1 h-3 w-3" />
          Clear
        </Button>
      )}
    </div>
  );
}
