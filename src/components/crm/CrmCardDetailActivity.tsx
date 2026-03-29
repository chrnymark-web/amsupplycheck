import { useCrmActivity } from "@/hooks/use-crm";
import { format } from "date-fns";
import { Activity } from "lucide-react";

const ACTION_LABELS: Record<string, string> = {
  created: "Deal created",
  stage_changed: "Stage changed",
  assigned: "Assigned",
  unassigned: "Unassigned",
  label_added: "Label added",
  label_removed: "Label removed",
  due_date_set: "Due date set",
  due_date_removed: "Due date removed",
  comment_added: "Comment added",
  field_updated: "Field updated",
  archived: "Archived",
};

function formatDetails(action: string, details: Record<string, unknown>): string {
  switch (action) {
    case "stage_changed":
      return `${details.from} → ${details.to}`;
    case "label_added":
    case "label_removed":
      return `"${details.label}"`;
    case "field_updated":
      return `${details.field}: ${details.from ?? "empty"} → ${details.to}`;
    case "comment_added":
      return `"${details.preview}${(details.preview as string)?.length >= 50 ? "..." : ""}"`;
    case "created":
      return details.source === "quote_request" ? "From quote request" : "Manual";
    default:
      return "";
  }
}

export function CrmCardDetailActivity({ dealId }: { dealId: string }) {
  const { data: activities, isLoading } = useCrmActivity(dealId);

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground uppercase">
        <Activity className="h-3 w-3" />
        Activity ({activities?.length || 0})
      </h4>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {(activities || []).map((a) => (
            <div key={a.id} className="flex items-start gap-2 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 mt-1.5 shrink-0" />
              <div className="min-w-0">
                <span className="font-medium">
                  {ACTION_LABELS[a.action] || a.action}
                </span>
                {formatDetails(a.action, a.details) && (
                  <span className="text-muted-foreground ml-1">
                    {formatDetails(a.action, a.details)}
                  </span>
                )}
                <p className="text-[10px] text-muted-foreground">
                  {format(new Date(a.created_at), "MMM d 'at' HH:mm")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
