import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCreateDeal, useCrmStages } from "@/hooks/use-crm";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CrmCreateDealDialog({ open, onOpenChange }: Props) {
  const { data: stages } = useCrmStages();
  const createDeal = useCreateDeal();
  const [form, setForm] = useState({
    title: "",
    contact_name: "",
    contact_email: "",
    technology: "",
    material: "",
    volume: "",
    project_description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.contact_name || !form.contact_email) {
      toast.error("Title, name, and email are required");
      return;
    }

    const newStage = stages?.find((s) => s.slug === "new");
    if (!newStage) return;

    try {
      await createDeal.mutateAsync({
        ...form,
        technology: form.technology || null,
        material: form.material || null,
        volume: form.volume || null,
        project_description: form.project_description || null,
        stage_id: newStage.id,
        quote_request_id: null,
        supplier_context: null,
        source_page: null,
        assigned_to: null,
        due_date: null,
        deal_value: null,
        position: Date.now(), // Large number, will be at the end
      });
      toast.success("Deal created");
      setForm({
        title: "", contact_name: "", contact_email: "",
        technology: "", material: "", volume: "", project_description: "",
      });
      onOpenChange(false);
    } catch {
      toast.error("Failed to create deal");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Deal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="text-xs">Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Deal title"
              className="h-8"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Contact Name *</Label>
              <Input
                value={form.contact_name}
                onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))}
                placeholder="John Doe"
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Contact Email *</Label>
              <Input
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
                placeholder="john@example.com"
                className="h-8"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Technology</Label>
              <Input
                value={form.technology}
                onChange={(e) => setForm((f) => ({ ...f, technology: e.target.value }))}
                placeholder="FDM, SLS..."
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Material</Label>
              <Input
                value={form.material}
                onChange={(e) => setForm((f) => ({ ...f, material: e.target.value }))}
                placeholder="PLA, Nylon..."
                className="h-8"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Project Description</Label>
            <Textarea
              value={form.project_description}
              onChange={(e) => setForm((f) => ({ ...f, project_description: e.target.value }))}
              placeholder="Brief project details..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createDeal.isPending}>
              {createDeal.isPending ? "Creating..." : "Create Deal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
