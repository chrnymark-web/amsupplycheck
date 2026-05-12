import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

type SupplierOption = { id: string; name: string };

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function SubscriptionEntryForm() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [paidUsd, setPaidUsd] = useState('600');
  const [paidAt, setPaidAt] = useState(toDateInput(new Date()));
  const [expiresAt, setExpiresAt] = useState(toDateInput(addMonths(new Date(), 12)));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase
        .from('suppliers')
        .select('id, name')
        .order('name', { ascending: true })
        .limit(2000);
      setSuppliers((data ?? []) as SupplierOption[]);
    })();
  }, [open]);

  useEffect(() => {
    setExpiresAt(toDateInput(addMonths(new Date(paidAt), 12)));
  }, [paidAt]);

  const filteredSuppliers = supplierFilter
    ? suppliers.filter(s => s.name.toLowerCase().includes(supplierFilter.toLowerCase())).slice(0, 30)
    : suppliers.slice(0, 30);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supplierId) {
      toast.error('Vælg en supplier');
      return;
    }
    const amount = Number(paidUsd);
    if (!amount || amount <= 0) {
      toast.error('Ugyldigt beløb');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({
          is_partner: true,
          subscription_paid_usd: amount,
          subscription_paid_at: new Date(paidAt).toISOString(),
          subscription_expires_at: new Date(expiresAt).toISOString(),
          subscription_status: 'active',
        })
        .eq('id', supplierId);

      if (error) throw error;

      toast.success(`Subscription registreret: $${amount} for ${suppliers.find(s => s.id === supplierId)?.name}`);
      queryClient.invalidateQueries({ queryKey: ['weekly-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['partner-revenue'] });
      setOpen(false);
      setSupplierId('');
      setSupplierFilter('');
      setPaidUsd('600');
    } catch (err) {
      toast.error('Kunne ikke gemme: ' + (err instanceof Error ? err.message : 'ukendt fejl'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Registrér subscription
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrér partner-subscription</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="supplier-search">Supplier</Label>
            <Input
              id="supplier-search"
              placeholder="Søg efter navn…"
              value={supplierFilter}
              onChange={e => setSupplierFilter(e.target.value)}
              className="mb-2"
            />
            <div className="max-h-40 overflow-y-auto border rounded-md divide-y">
              {filteredSuppliers.length === 0 && (
                <p className="text-xs text-muted-foreground p-2">Ingen suppliers fundet.</p>
              )}
              {filteredSuppliers.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { setSupplierId(s.id); setSupplierFilter(s.name); }}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-muted/50 ${
                    supplierId === s.id ? 'bg-primary/10 text-primary font-medium' : ''
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="paid-usd">Beløb (USD)</Label>
            <Input
              id="paid-usd"
              type="number"
              min="0"
              step="1"
              value={paidUsd}
              onChange={e => setPaidUsd(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="paid-at">Betalt</Label>
              <Input
                id="paid-at"
                type="date"
                value={paidAt}
                onChange={e => setPaidAt(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="expires-at">Udløber</Label>
              <Input
                id="expires-at"
                type="date"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" disabled={submitting || !supplierId} className="w-full">
            {submitting ? 'Gemmer…' : 'Gem subscription'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
