import { useState } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CrmLabelBadge } from "./CrmLabelBadge";
import { CrmLabelManager } from "./CrmLabelManager";
import { CrmCardDetailComments } from "./CrmCardDetailComments";
import { CrmCardDetailActivity } from "./CrmCardDetailActivity";
import { useCrmStages, useUpdateDeal, useArchiveDeal } from "@/hooks/use-crm";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  CalendarIcon, Mail, ExternalLink, DollarSign, Archive, Pencil,
} from "lucide-react";
import type { CrmDeal } from "@/types/crm";

interface Props {
  deal: CrmDeal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CrmCardDetail({ deal, open, onOpenChange }: Props) {
  const { data: stages } = useCrmStages();
  const updateDeal = useUpdateDeal();
  const archiveDeal = useArchiveDeal();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");

  if (!deal) return null;

  const handleFieldUpdate = async (
    field: string,
    value: unknown,
    dbField?: string
  ) => {
    const key = dbField || field;
    try {
      await updateDeal.mutateAsync({
        dealId: deal.id,
        updates: { [key]: value } as Partial<CrmDeal>,
        field,
        oldValue: (deal as any)[key],
        newValue: value,
      });
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleArchive = async () => {
    try {
      await archiveDeal.mutateAsync(deal.id);
      toast.success("Deal archived");
      onOpenChange(false);
    } catch {
      toast.error("Failed to archive");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
        <SheetHeader className="pb-4">
          {/* Title */}
          {editingTitle ? (
            <Input
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={() => {
                if (titleValue.trim() && titleValue !== deal.title) {
                  handleFieldUpdate("title", titleValue.trim());
                }
                setEditingTitle(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") setEditingTitle(false);
              }}
              autoFocus
              className="text-lg font-semibold"
            />
          ) : (
            <SheetTitle
              className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
              onClick={() => {
                setTitleValue(deal.title);
                setEditingTitle(true);
              }}
            >
              {deal.title}
              <Pencil className="h-3 w-3 text-muted-foreground" />
            </SheetTitle>
          )}
        </SheetHeader>

        <div className="space-y-5">
          {/* Stage selector */}
          <div>
            <Label className="text-xs text-muted-foreground">Stage</Label>
            <Select
              value={deal.stage_id}
              onValueChange={(v) => {
                const fromStage = stages?.find((s) => s.id === deal.stage_id);
                const toStage = stages?.find((s) => s.id === v);
                handleFieldUpdate("stage", toStage?.name, "stage_id");
                // Also need to do the stage move update
                updateDeal.mutate({
                  dealId: deal.id,
                  updates: { stage_id: v } as Partial<CrmDeal>,
                });
              }}
            >
              <SelectTrigger className="h-8 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(stages || []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contact info */}
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium">{deal.contact_name}</p>
            <a
              href={`mailto:${deal.contact_email}`}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <Mail className="h-3 w-3" />
              {deal.contact_email}
            </a>
            {deal.quote_request_id && (
              <Badge variant="outline" className="text-[10px]">
                From Quote Request
              </Badge>
            )}
          </div>

          {/* Labels */}
          <div>
            <Label className="text-xs text-muted-foreground">Labels</Label>
            <div className="flex flex-wrap items-center gap-1 mt-1">
              {deal.labels?.map((l) => (
                <CrmLabelBadge key={l.id} label={l} />
              ))}
              <CrmLabelManager deal={deal} />
            </div>
          </div>

          {/* Fields grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Technology</Label>
              <Input
                defaultValue={deal.technology || ""}
                onBlur={(e) => {
                  if (e.target.value !== (deal.technology || "")) {
                    handleFieldUpdate("technology", e.target.value || null);
                  }
                }}
                placeholder="e.g. FDM"
                className="h-8 text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Material</Label>
              <Input
                defaultValue={deal.material || ""}
                onBlur={(e) => {
                  if (e.target.value !== (deal.material || "")) {
                    handleFieldUpdate("material", e.target.value || null);
                  }
                }}
                placeholder="e.g. PLA"
                className="h-8 text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Volume</Label>
              <Input
                defaultValue={deal.volume || ""}
                onBlur={(e) => {
                  if (e.target.value !== (deal.volume || "")) {
                    handleFieldUpdate("volume", e.target.value || null);
                  }
                }}
                placeholder="prototype / small batch"
                className="h-8 text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Deal Value</Label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  type="number"
                  defaultValue={deal.deal_value || ""}
                  onBlur={(e) => {
                    const val = e.target.value ? parseFloat(e.target.value) : null;
                    if (val !== deal.deal_value) {
                      handleFieldUpdate("deal_value", val);
                    }
                  }}
                  placeholder="0.00"
                  className="h-8 text-sm pl-7"
                />
              </div>
            </div>
          </div>

          {/* Due date */}
          <div>
            <Label className="text-xs text-muted-foreground">Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-start h-8 mt-1 text-sm">
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  {deal.due_date
                    ? format(new Date(deal.due_date), "PPP")
                    : "Set due date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deal.due_date ? new Date(deal.due_date) : undefined}
                  onSelect={(date) => {
                    handleFieldUpdate("due_date", date?.toISOString() || null);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Project description */}
          {deal.project_description && (
            <div>
              <Label className="text-xs text-muted-foreground">Project Description</Label>
              <p className="text-sm mt-1 bg-muted/30 rounded p-2 whitespace-pre-wrap">
                {deal.project_description}
              </p>
            </div>
          )}

          {/* Supplier context */}
          {deal.supplier_context && (
            <div>
              <Label className="text-xs text-muted-foreground">Supplier Context</Label>
              <p className="text-sm mt-1 text-muted-foreground">{deal.supplier_context}</p>
            </div>
          )}

          {/* Comments & Activity tabs */}
          <Tabs defaultValue="comments">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="comments" className="text-xs">Comments</TabsTrigger>
              <TabsTrigger value="activity" className="text-xs">Activity</TabsTrigger>
            </TabsList>
            <TabsContent value="comments" className="mt-3">
              <CrmCardDetailComments dealId={deal.id} />
            </TabsContent>
            <TabsContent value="activity" className="mt-3">
              <CrmCardDetailActivity dealId={deal.id} />
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="destructive"
              size="sm"
              className="text-xs"
              onClick={handleArchive}
            >
              <Archive className="mr-1 h-3 w-3" />
              Archive Deal
            </Button>
            <span className="text-[10px] text-muted-foreground self-center ml-auto">
              Created {format(new Date(deal.created_at), "PPP")}
            </span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
