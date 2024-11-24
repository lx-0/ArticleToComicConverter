import { ArticleToComicForm } from "@/components/ArticleToComicForm";
import { ProcessStepper } from "@/components/ProcessStepper";
import { ComicResult } from "@/components/ComicResult";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { regenerateComic } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { getComicGeneration } from "@/lib/api";
import type { ComicGeneration, Step } from "@db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronUp, ChevronDown } from "lucide-react";

export default function Home() {
  const [cacheId, setCacheId] = useState<string | null>(null);
  const [showProgress, setShowProgress] = useState(true);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: comicData, isLoading } = useQuery({
    queryKey: ["comic", cacheId],
    queryFn: () => getComicGeneration(cacheId!),
    enabled: !!cacheId,
    refetchInterval: (query) => {
      const data = query.state.data as ComicGeneration;
      // Stop polling when generation is complete or has error
      if (data?.steps && Array.isArray(data.steps) && data.steps.length > 0 && 
          data.steps.every((step: Step) => 
            step.status === "complete" || step.status === "error")) {
        return false;
      }
      // Poll every 1 second while in progress
      return 1000;
    },
  });

  useEffect(() => {
    if (comicData?.steps?.every((step: Step) => step.status === "complete")) {
      setShowProgress(false);
    }
  }, [comicData?.steps]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950 to-black text-white p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
            Article to Comic Converter
          </h1>
          <p className="text-purple-200">
            Transform any article into a visually stunning comic using AI
          </p>
        </header>

        <Card className="bg-black/50 border-purple-500/30">
          <CardContent className="p-6">
            <ArticleToComicForm onGenerate={setCacheId} />
          </CardContent>
        </Card>

        {cacheId && (
          <div className="space-y-8">
            <Collapsible open={showProgress} onOpenChange={setShowProgress}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-purple-200">Generation Progress</h3>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-purple-400">
                    {showProgress ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <ProcessStepper 
                  steps={comicData?.steps || []} 
                  isFromCache={comicData?.fromCache}
                />
              </CollapsibleContent>
            </Collapsible>
            
            {comicData?.steps?.every((step: Step) => step.status === "complete") && (
              <ComicResult
                title={comicData.title || "Untitled Comic"}
                summary={comicData.summary}
                imageUrls={comicData.imageUrls}
                isFromCache={comicData.fromCache}
                onRegenerate={async () => {
                  try {
                    await regenerateComic(cacheId);
                    await queryClient.invalidateQueries({ queryKey: ["comic", cacheId] });
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to regenerate comic. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
