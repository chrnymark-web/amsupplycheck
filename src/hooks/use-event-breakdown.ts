import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { HIGH_SIGNAL_EVENTS, EVENT_LABELS } from '@/lib/analytics';
import type { DateRange } from '@/components/admin/date-range-picker';

export type EventBreakdownRow = {
  eventName: string;
  label: string;
  count: number;
};

export type EventBreakdown = {
  rows: EventBreakdownRow[];
  totalEvents: number;
  uploadEvents: number;
};

async function fetchEventBreakdown(range: DateRange): Promise<EventBreakdown> {
  const fromIso = range.from.toISOString();
  const toIso = range.to.toISOString();
  const countHead = { count: 'exact' as const, head: true };

  const eventNames = Array.from(HIGH_SIGNAL_EVENTS);

  const eventCount = (eventName: string) =>
    supabase
      .from('analytics_events')
      .select('*', countHead)
      .eq('event_name', eventName)
      .gte('created_at', fromIso)
      .lte('created_at', toIso);

  const [uploadRes, ...eventResults] = await Promise.all([
    supabase
      .from('upload_events')
      .select('*', countHead)
      .gte('created_at', fromIso)
      .lte('created_at', toIso),
    ...eventNames.map(eventCount),
  ]);

  const rows: EventBreakdownRow[] = eventNames
    .map((name, i) => ({
      eventName: name,
      label: EVENT_LABELS[name] ?? name,
      count: eventResults[i].count ?? 0,
    }))
    .sort((a, b) => b.count - a.count);

  const totalEvents = rows.reduce((sum, r) => sum + r.count, 0);

  return {
    rows,
    totalEvents,
    uploadEvents: uploadRes.count ?? 0,
  };
}

export function useEventBreakdown(range: DateRange) {
  return useQuery({
    queryKey: ['event-breakdown', range.from.toISOString(), range.to.toISOString()],
    queryFn: () => fetchEventBreakdown(range),
    staleTime: 5 * 60 * 1000,
  });
}
