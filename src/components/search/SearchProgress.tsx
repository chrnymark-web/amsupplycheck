import { CheckCircle2, Loader2, Circle, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type SearchStatus = "idle" | "pending" | "analyzing" | "matching" | "ranking" | "completed" | "failed";

const STEPS = [
  { key: "analyzing", label: "Analyzing requirements with AI" },
  { key: "matching", label: "Searching suppliers" },
  { key: "ranking", label: "Ranking and generating explanations" },
] as const;

const STEP_ORDER: Record<string, number> = {
  pending: -1,
  analyzing: 0,
  matching: 1,
  ranking: 2,
  completed: 3,
  failed: -2,
};

interface SearchProgressProps {
  status: SearchStatus;
}

export function SearchProgress({ status }: SearchProgressProps) {
  const currentStep = STEP_ORDER[status] ?? -1;

  if (status === "idle") return null;

  return (
    <Card className="bg-gradient-card border-border shadow-card">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">AI is finding suppliers</h3>
          <span className="relative ml-auto flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-primary/60 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-2.5">
          {STEPS.map((step, i) => {
            const isDone = currentStep > i;
            const isActive = currentStep === i;
            const isPending = currentStep < i;

            return (
              <div key={step.key} className="flex items-center gap-3">
                {isDone && (
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                )}
                {isActive && (
                  <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                )}
                {isPending && (
                  <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                )}
                <span
                  className={
                    isDone
                      ? "text-sm text-foreground font-medium"
                      : isActive
                        ? "text-sm text-foreground font-medium"
                        : "text-sm text-muted-foreground"
                  }
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
