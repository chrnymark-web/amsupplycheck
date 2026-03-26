import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/ui/navbar";
import { Loader2 } from "lucide-react";

const NormalizeData = () => {
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [result, setResult] = useState<{
    updated: number;
    skipped: number;
    message: string;
  } | null>(null);

  const handleNormalize = async () => {
    setIsNormalizing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('normalize-supplier-data');

      if (error) throw error;

      if (data.success) {
        setResult({
          updated: data.updated,
          skipped: data.skipped,
          message: data.message
        });
        toast.success(`Data normalized! ${data.updated} suppliers updated.`);
      } else {
        throw new Error(data.error || 'Normalization failed');
      }
    } catch (error: any) {
      console.error('Normalization error:', error);
      toast.error(`Normalization error: ${error.message}`);
    } finally {
      setIsNormalizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto p-6">
          <h1 className="text-2xl font-bold mb-4">Normalize Supplier Data</h1>
          <p className="text-muted-foreground mb-6">
            This will update all suppliers so their technologies and materials use
            consistent, human-readable names instead of IDs. This ensures that filtering
            works correctly.
          </p>

          <Button 
            onClick={handleNormalize} 
            disabled={isNormalizing}
            size="lg"
            className="w-full"
          >
            {isNormalizing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Normalizing data...
              </>
            ) : (
              'Start Normalization'
            )}
          </Button>

          {result && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h2 className="font-semibold mb-2">Result:</h2>
              <ul className="space-y-1 text-sm">
                <li>✅ {result.updated} suppliers updated</li>
                <li>⏭️ {result.skipped} suppliers already correct</li>
              </ul>
              <p className="mt-2 text-sm text-muted-foreground">{result.message}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default NormalizeData;
