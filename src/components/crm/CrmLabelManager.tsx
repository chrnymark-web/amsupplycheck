import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCrmLabels, useCreateLabel, useToggleDealLabel } from "@/hooks/use-crm";
import { CrmLabelBadge } from "./CrmLabelBadge";
import { Tag, Plus, Check } from "lucide-react";
import type { CrmDeal } from "@/types/crm";

const LABEL_COLORS = [
  "#ef4444", "#f59e0b", "#22c55e", "#3b82f6",
  "#8b5cf6", "#ec4899", "#06b6d4", "#6b7280",
];

interface Props {
  deal: CrmDeal;
}

export function CrmLabelManager({ deal }: Props) {
  const { data: labels } = useCrmLabels();
  const createLabel = useCreateLabel();
  const toggleLabel = useToggleDealLabel();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(LABEL_COLORS[0]);
  const [showCreate, setShowCreate] = useState(false);

  const dealLabelIds = new Set(deal.labels?.map((l) => l.id) || []);

  const handleToggle = (labelId: string, labelName: string) => {
    const isOn = dealLabelIds.has(labelId);
    toggleLabel.mutate({
      dealId: deal.id,
      labelId,
      labelName,
      add: !isOn,
    });
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createLabel.mutateAsync({ name: newName.trim(), color: newColor });
    setNewName("");
    setShowCreate(false);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <Tag className="mr-1 h-3 w-3" />
          Labels
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-1">
          {(labels || []).map((label) => (
            <button
              key={label.id}
              onClick={() => handleToggle(label.id, label.name)}
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-muted text-left text-sm"
            >
              <span
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: label.color }}
              />
              <span className="flex-1 truncate">{label.name}</span>
              {dealLabelIds.has(label.id) && (
                <Check className="h-3 w-3 text-primary" />
              )}
            </button>
          ))}

          {showCreate ? (
            <div className="pt-2 border-t space-y-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Label name"
                className="h-7 text-xs"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
              <div className="flex gap-1">
                {LABEL_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className={`w-5 h-5 rounded-full border-2 ${
                      newColor === c ? "border-foreground" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex gap-1">
                <Button size="sm" className="h-6 text-xs flex-1" onClick={handleCreate}>
                  Create
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-muted text-left text-xs text-muted-foreground"
            >
              <Plus className="h-3 w-3" />
              Create new label
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
