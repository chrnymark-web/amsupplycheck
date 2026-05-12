import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type Status = 'on-track' | 'warn' | 'off-track' | 'neutral';

function statusForRatio(ratio: number): Status {
  if (ratio >= 1) return 'on-track';
  if (ratio >= 0.6) return 'warn';
  if (ratio > 0) return 'off-track';
  return 'neutral';
}

const STATUS_CLASSES: Record<Status, { border: string; dot: string; valueColor: string }> = {
  'on-track': {
    border: 'border-green-500/40',
    dot: 'bg-green-500',
    valueColor: 'text-green-600 dark:text-green-400',
  },
  warn: {
    border: 'border-amber-500/40',
    dot: 'bg-amber-500',
    valueColor: 'text-amber-600 dark:text-amber-400',
  },
  'off-track': {
    border: 'border-red-500/40',
    dot: 'bg-red-500',
    valueColor: 'text-red-600 dark:text-red-400',
  },
  neutral: {
    border: 'border-border',
    dot: 'bg-muted-foreground/40',
    valueColor: 'text-foreground',
  },
};

export function WeeklyKpiCard({
  icon: Icon,
  label,
  value,
  target,
  unit,
  sub,
  revenueCritical,
  loading,
}: {
  icon?: React.ElementType;
  label: string;
  value: number | string;
  target?: number | string;
  unit?: string;
  sub?: string;
  revenueCritical?: boolean;
  loading?: boolean;
}) {
  const numericValue = typeof value === 'number' ? value : Number(value) || 0;
  const numericTarget = typeof target === 'number' ? target : Number(target) || 0;
  const ratio = numericTarget > 0 ? numericValue / numericTarget : 0;
  const status: Status = numericTarget > 0 ? statusForRatio(ratio) : 'neutral';
  const styles = STATUS_CLASSES[status];

  return (
    <Card className={`bg-card ${revenueCritical ? 'border-green-500/60 ring-1 ring-green-500/20' : styles.border} relative overflow-hidden`}>
      {revenueCritical && (
        <div className="absolute top-1 right-1 text-[9px] font-semibold uppercase tracking-wide text-green-600 dark:text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">
          $ revenue
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} aria-hidden />
          <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
        </div>
        {loading ? (
          <Skeleton className="h-7 w-20" />
        ) : (
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold ${styles.valueColor}`}>{value}</span>
            {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
          </div>
        )}
        {target !== undefined && !loading && (
          <p className="text-xs text-muted-foreground mt-1">
            mål: {target}{unit ? ` ${unit}` : ''}
          </p>
        )}
        {sub && !loading && (
          <p className="text-[11px] text-muted-foreground/80 mt-0.5">{sub}</p>
        )}
      </CardContent>
    </Card>
  );
}
