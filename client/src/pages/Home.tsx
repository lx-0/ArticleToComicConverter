import { ArticleToComicForm } from "@/components/ArticleToComicForm";
import { ProcessStepper } from "@/components/ProcessStepper";
import { ComicResult } from "@/components/ComicResult";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { regenerateComic } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { getComicGeneration } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const [cacheId, setCacheId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: comicData, isLoading } = useQuery({
    queryKey: ["comic", cacheId],
    queryFn: () => getComicGeneration(cacheId!),
    enabled: !!cacheId,
  });

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
            <ProcessStepper steps={comicData?.steps || []} />
            {comicData?.steps.every(step => step.status === "complete") && (
              <ComicResult
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
