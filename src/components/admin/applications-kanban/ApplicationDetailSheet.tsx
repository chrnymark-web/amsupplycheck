import { useEffect, useState } from 'react';
import { Mail, Trash2, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  useUpdateApplicationFields,
  useDeleteApplications,
  type Temperature,
} from '@/hooks/use-supplier-applications';
import { cn } from '@/lib/utils';
import { STAGES } from './stages';
import type { CompanyGroup } from './group';

type Props = {
  group: CompanyGroup | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type TempChoice = Temperature | 'none';

const TEMP_OPTIONS: { value: TempChoice; label: string; dotClass: string }[] = [
  { value: 'none', label: 'None', dotClass: 'bg-muted-foreground/40' },
  { value: 'cold', label: 'Cold', dotClass: 'bg-cyan-400' },
  { value: 'warm', label: 'Warm', dotClass: 'bg-amber-400' },
  { value: 'hot', label: 'Hot', dotClass: 'bg-rose-400' },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function ApplicationDetailSheet({ group, open, onOpenChange }: Props) {
  const updateFields = useUpdateApplicationFields();
  const deleteApplications = useDeleteApplications();
  const { toast } = useToast();

  const [notes, setNotes] = useState('');
  const [valueInput, setValueInput] = useState('');
  const [temp, setTemp] = useState<TempChoice>('none');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!group) return;
    setNotes(group.notes ?? '');
    setValueInput(group.estimatedValueUsd != null ? String(group.estimatedValueUsd) : '');
    setTemp(group.temperature ?? 'none');
  }, [group]);

  if (!group) return null;

  const stage = STAGES.find(s => s.id === group.status);
  const parsedValue = valueInput.trim() === '' ? null : Number(valueInput);
  const valueInvalid = parsedValue !== null && (Number.isNaN(parsedValue) || parsedValue < 0);

  const dirty =
    notes !== (group.notes ?? '') ||
    parsedValue !== group.estimatedValueUsd ||
    (temp === 'none' ? null : temp) !== group.temperature;

  async function handleSave() {
    if (!group || valueInvalid) return;
    setSaving(true);
    try {
      await updateFields(group.ids, {
        notes: notes.trim() === '' ? null : notes,
        estimated_value_usd: parsedValue,
        temperature: temp === 'none' ? null : temp,
      });
      toast({ title: 'Saved', description: `${group.company} updated.` });
      onOpenChange(false);
    } catch (e) {
      toast({
        title: 'Could not save',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!group) return;
    setDeleting(true);
    try {
      await deleteApplications(group.ids);
      toast({
        title: 'Deleted',
        description: `${group.company} removed from pipeline.`,
      });
      onOpenChange(false);
    } catch (e) {
      toast({
        title: 'Could not delete',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="text-foreground flex items-center gap-2">
            <span>{group.company}</span>
            {group.count > 1 && (
              <Badge variant="outline" className="text-[10px] font-normal">
                ×{group.count} applications
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription className="text-xs">
            {stage?.label ?? group.status} · applied {formatDate(group.firstAppliedAt)}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <section className="space-y-2">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Contact</div>
            <div className="text-sm text-foreground">{group.contactName}</div>
            <a
              href={`mailto:${group.contactEmail}`}
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              {group.contactEmail}
            </a>
          </section>

          <section className="space-y-2">
            <Label htmlFor="card-notes" className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Notes
            </Label>
            <Textarea
              id="card-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={6}
              placeholder="Call notes, what they need, follow-up actions…"
              className="resize-y bg-background"
            />
          </section>

          <section className="space-y-2">
            <Label htmlFor="card-value" className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Estimated value
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                $
              </span>
              <Input
                id="card-value"
                type="number"
                inputMode="decimal"
                min={0}
                step={100}
                value={valueInput}
                onChange={e => setValueInput(e.target.value)}
                placeholder="0"
                className={cn('pl-7 bg-background', valueInvalid && 'border-rose-500/60')}
              />
            </div>
            {valueInvalid && (
              <p className="text-[11px] text-rose-300">Value must be a non-negative number.</p>
            )}
          </section>

          <section className="space-y-2">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Temperature
            </Label>
            <RadioGroup
              value={temp}
              onValueChange={v => setTemp(v as TempChoice)}
              className="grid grid-cols-4 gap-2"
            >
              {TEMP_OPTIONS.map(opt => (
                <Label
                  key={opt.value}
                  htmlFor={`temp-${opt.value}`}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-lg border border-border bg-background py-3 px-2 cursor-pointer transition-colors',
                    'hover:border-foreground/30',
                    temp === opt.value && 'border-foreground/60 bg-foreground/[0.04]',
                  )}
                >
                  <RadioGroupItem id={`temp-${opt.value}`} value={opt.value} className="sr-only" />
                  <span className={cn('h-2 w-2 rounded-full', opt.dotClass)} />
                  <span className="text-xs">{opt.label}</span>
                </Label>
              ))}
            </RadioGroup>
          </section>
        </div>

        <SheetFooter className="px-6 py-4 border-t border-border flex-row sm:justify-between gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-rose-300/90 hover:text-rose-200 hover:bg-rose-500/10">
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {group.company}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes {group.count} application{group.count > 1 ? 's' : ''} from the pipeline.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-rose-600 hover:bg-rose-600/90 focus:ring-rose-600"
                >
                  {deleting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button onClick={handleSave} disabled={!dirty || saving || valueInvalid}>
            {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
