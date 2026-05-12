import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Target } from 'lucide-react';
import { DKK_PER_USD, GOAL_MRR_USD } from '@/hooks/use-weekly-kpis';

function fmtUsd(usd: number): string {
  return `$${usd.toLocaleString('en-US')}`;
}

function fmtDkk(usd: number): string {
  return `${Math.round(usd * DKK_PER_USD).toLocaleString('da-DK')} DKK`;
}

export function GoalProgressBar({
  currentMrr,
  gap,
  pctOfGoal,
  subscriptionRevenue,
  leadRevenue,
  loading,
}: {
  currentMrr: number;
  gap: number;
  pctOfGoal: number;
  subscriptionRevenue: number;
  leadRevenue: number;
  loading?: boolean;
}) {
  const goalDkk = Math.round(GOAL_MRR_USD * DKK_PER_USD); // ≈ 30.140 DKK
  const widthPct = Math.min(pctOfGoal, 100);

  return (
    <Card className="bg-gradient-to-br from-card to-muted/30 border-border">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
          <h2 className="text-lg font-semibold text-foreground">Vejen til 30k DKK/md</h2>
        </div>

        {loading ? (
          <>
            <Skeleton className="h-8 w-64 mb-3" />
            <Skeleton className="h-3 w-full" />
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-4">
              <span className="text-3xl font-bold text-foreground">{fmtUsd(currentMrr)}</span>
              <span className="text-xl text-muted-foreground">/ {fmtUsd(GOAL_MRR_USD)}/md</span>
              <span className="text-sm text-muted-foreground">
                ({fmtDkk(currentMrr)} af 30.000 DKK · {pctOfGoal.toFixed(1)}%)
              </span>
            </div>

            <div className="h-3 w-full rounded-full bg-muted/50 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-[width] duration-700 ease-out"
                style={{ width: `${widthPct}%` }}
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
              <span>
                Subscription: <strong className="text-foreground">{fmtUsd(Math.round(subscriptionRevenue))}/md</strong> (partnere × $50)
              </span>
              <span>
                Leads: <strong className="text-foreground">{fmtUsd(Math.round(leadRevenue))}/md</strong> (sidste 30d × $50)
              </span>
              <span>
                Gap: <strong className={gap > 0 ? 'text-red-500' : 'text-green-600 dark:text-green-400'}>{fmtUsd(gap)}/md</strong>
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
