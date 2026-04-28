import { CheckCircle2, Loader2, Circle, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type SearchStatus = "idle" | "uploading" | "pending" | "analyzing" | "matching" | "ranking" | "completed" | "failed";

const STEPS = [
  { key: "analyzing", label: "Analyzing your requirements" },
  { key: "matching", label: "Searching suppliers" },
  { key: "ranking", label: "Ranking and generating explanations" },
] as const;

const STEP_ORDER: Record<string, number> = {
  uploading: 0,
  pending: 0,
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
    <Dialog open modal>
      <DialogContent
        className="max-w-md bg-gradient-card border-border shadow-card p-0 [&>button]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <DialogTitle className="text-sm font-semibold text-foreground">
              Finding suppliers
            </DialogTitle>
            <span className="relative ml-auto flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary/60 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
          </div>
          <DialogDescription className="sr-only">
            Searching for suppliers matching your requirements
          </DialogDescription>
        </div>
        <div className="px-4 pb-4">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
