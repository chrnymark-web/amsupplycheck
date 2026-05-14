import type { Database } from '@/integrations/supabase/types';

export type ApplicationStatus = Database['public']['Enums']['supplier_application_status'];

export type StageConfig = {
  id: ApplicationStatus;
  label: string;
  // Tailwind classes — header tint only, kept off the default blue/indigo palette
  // per the project's anti-generic guardrails. Soft, low-saturation accents.
  headerClass: string;
  dotClass: string;
};

export const STAGES: readonly StageConfig[] = [
  {
    id: 'pending',
    label: 'Pending',
    headerClass: 'bg-slate-500/10 text-slate-200',
    dotClass: 'bg-slate-400',
  },
  {
    id: 'contacted',
    label: 'Contacted',
    headerClass: 'bg-amber-500/10 text-amber-200',
    dotClass: 'bg-amber-400',
  },
  {
    id: 'demo_booked',
    label: 'Demo booked',
    headerClass: 'bg-violet-500/10 text-violet-200',
    dotClass: 'bg-violet-400',
  },
  {
    id: 'approved',
    label: 'Approved',
    headerClass: 'bg-teal-500/10 text-teal-200',
    dotClass: 'bg-teal-400',
  },
  {
    id: 'onboarded',
    label: 'Onboarded',
    headerClass: 'bg-emerald-500/10 text-emerald-200',
    dotClass: 'bg-emerald-400',
  },
  {
    id: 'rejected',
    label: 'Rejected',
    headerClass: 'bg-rose-500/10 text-rose-200',
    dotClass: 'bg-rose-400',
  },
] as const;

export const STAGE_IDS: readonly ApplicationStatus[] = STAGES.map(s => s.id);
