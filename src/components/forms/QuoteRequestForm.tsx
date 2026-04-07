import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, CheckCircle } from 'lucide-react';
import { trackCTAClick } from '@/lib/analytics';

const quoteSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Invalid email').max(255),
  project_description: z.string().trim().max(2000).optional(),
  technology_preference: z.string().optional(),
  material_preference: z.string().optional(),
  volume: z.string().optional(),
  honeypot: z.string().max(0, 'Bot detected'),
});

type QuoteFormValues = z.infer<typeof quoteSchema>;

interface QuoteRequestFormProps {
  supplierContext?: string;
  technologyPreset?: string;
  materialPreset?: string;
  variant?: 'dialog' | 'inline';
  triggerLabel?: string;
  triggerClassName?: string;
}

const TECHNOLOGIES = ['FDM/FFF', 'SLA', 'SLS', 'MJF', 'DMLS', 'SLM', 'Binder Jetting', 'Material Jetting', 'DLP', 'EBM', 'CNC Machining'];
const MATERIALS = ['PLA', 'ABS', 'Nylon (PA12)', 'PETG', 'Resin', 'Stainless Steel', 'Aluminum', 'Titanium', 'Inconel', 'Copper'];

function QuoteForm({ supplierContext, technologyPreset, materialPreset, onSuccess }: {
  supplierContext?: string;
  technologyPreset?: string;
  materialPreset?: string;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      technology_preference: technologyPreset || '',
      material_preference: materialPreset || '',
      honeypot: '',
    },
  });

  const onSubmit = async (values: QuoteFormValues) => {
    if (values.honeypot) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('quote_requests' as any).insert({
        name: values.name,
        email: values.email,
        project_description: values.project_description || null,
        technology_preference: values.technology_preference || null,
        material_preference: values.material_preference || null,
        volume: values.volume || null,
        supplier_context: supplierContext || null,
        source_page: window.location.pathname,
      } as any);

      if (error) throw error;

      trackCTAClick('quote_request_submit', supplierContext || 'general');
      toast({ title: 'Quote request sent!', description: 'We\'ll connect you with matching suppliers.' });
      onSuccess();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to submit. Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input id="name" placeholder="Your name" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" placeholder="you@company.com" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="project_description">Project Description</Label>
        <Textarea id="project_description" placeholder="Describe your project, parts, quantities..." {...register('project_description')} className="min-h-[80px]" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label>Technology</Label>
          <Select value={watch('technology_preference')} onValueChange={(v) => setValue('technology_preference', v)}>
            <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>
              {TECHNOLOGIES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Material</Label>
          <Select value={watch('material_preference')} onValueChange={(v) => setValue('material_preference', v)}>
            <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>
              {MATERIALS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Volume</Label>
          <Select value={watch('volume')} onValueChange={(v) => setValue('volume', v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="prototype">Prototype (1-10)</SelectItem>
              <SelectItem value="small_batch">Small Batch (10-100)</SelectItem>
              <SelectItem value="production">Production (100+)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Honeypot */}
      <input type="text" {...register('honeypot')} className="sr-only" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Sending...' : 'Request Quote'}
        <Send className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
}

export const QuoteRequestForm: React.FC<QuoteRequestFormProps> = ({
  supplierContext,
  technologyPreset,
  materialPreset,
  variant = 'inline',
  triggerLabel = 'Request Quote',
  triggerClassName,
}) => {
  const [submitted, setSubmitted] = useState(false);
  const [open, setOpen] = useState(false);

  if (variant === 'dialog') {
    return (
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSubmitted(false); }}>
        <DialogTrigger asChild>
          <Button className={triggerClassName}>
            {triggerLabel} <Send className="ml-2 h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Request a Quote{supplierContext ? ` from ${supplierContext}` : ''}</DialogTitle>
          </DialogHeader>
          {submitted ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-primary mx-auto mb-3" />
              <p className="font-semibold text-foreground">Quote request sent!</p>
              <p className="text-sm text-muted-foreground mt-1">We'll connect you with matching suppliers soon.</p>
            </div>
          ) : (
            <QuoteForm supplierContext={supplierContext} technologyPreset={technologyPreset} materialPreset={materialPreset} onSuccess={() => setSubmitted(true)} />
          )}
        </DialogContent>
      </Dialog>
    );
  }

  // Inline variant
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" />
          Get Matched with Suppliers
        </CardTitle>
      </CardHeader>
      <CardContent>
        {submitted ? (
          <div className="text-center py-6">
            <CheckCircle className="h-10 w-10 text-primary mx-auto mb-3" />
            <p className="font-semibold text-foreground">Quote request sent!</p>
            <p className="text-sm text-muted-foreground mt-1">We'll be in touch soon.</p>
          </div>
        ) : (
          <QuoteForm supplierContext={supplierContext} technologyPreset={technologyPreset} materialPreset={materialPreset} onSuccess={() => setSubmitted(true)} />
        )}
      </CardContent>
    </Card>
  );
};

export default QuoteRequestForm;
