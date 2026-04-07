import { CheckCircle2, Loader2, Circle } from "lucide-react";

type SearchStatus = "idle" | "pending" | "analyzing" | "matching" | "ranking" | "completed" | "failed";

const STEPS = [
  { key: "analyzing", label: "Analyserer krav med AI" },
  { key: "matching", label: "Søger blandt suppliers" },
  { key: "ranking", label: "Ranker og genererer forklaringer" },
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
    <div className="space-y-3 py-4">
      {STEPS.map((step, i) => {
        const isDone = currentStep > i;
        const isActive = currentStep === i;
        const isPending = currentStep < i;

        return (
          <div key={step.key} className="flex items-center gap-3">
            {isDone && (
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
            )}
            {isActive && (
              <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
            )}
            {isPending && (
              <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
            )}
            <span
              className={`text-sm ${
                isDone
                  ? "text-green-600 font-medium"
                  : isActive
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
