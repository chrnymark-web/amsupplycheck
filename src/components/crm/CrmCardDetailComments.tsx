import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCrmComments, useAddComment } from "@/hooks/use-crm";
import { format } from "date-fns";
import { MessageSquare, Send } from "lucide-react";

export function CrmCardDetailComments({ dealId }: { dealId: string }) {
  const { data: comments, isLoading } = useCrmComments(dealId);
  const addComment = useAddComment();
  const [body, setBody] = useState("");

  const handleSubmit = async () => {
    if (!body.trim()) return;
    try {
      await addComment.mutateAsync({ dealId, body: body.trim() });
      setBody("");
    } catch {
      // error handled by mutation
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground uppercase">
        <MessageSquare className="h-3 w-3" />
        Comments ({comments?.length || 0})
      </h4>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {(comments || []).map((c) => (
            <div key={c.id} className="bg-muted/50 rounded p-2">
              <p className="text-xs whitespace-pre-wrap">{c.body}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {format(new Date(c.created_at), "MMM d, yyyy 'at' HH:mm")}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          className="text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              handleSubmit();
            }
          }}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSubmit}
          disabled={!body.trim() || addComment.isPending}
          className="self-end"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
