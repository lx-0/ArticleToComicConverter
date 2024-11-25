import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { getComicGeneration } from "@/lib/api";
import { ComicResult } from "@/components/ComicResult";
import type { Step } from "@db/schema";
import { Footer } from "@/components/Footer";

export default function Comic() {
  const { cacheId } = useParams();
  const { data: comicData } = useQuery({
    queryKey: ["comic", cacheId],
    queryFn: () => getComicGeneration(cacheId!),
    enabled: !!cacheId,
  });

  if (!comicData?.steps?.every((step: Step) => step.status === "complete")) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-purple-950 to-black text-white p-6">
        <div className="h-full flex items-center justify-center">
          <div className="w-full max-w-md mx-auto text-center space-y-4">
            <div className="mx-auto w-12 h-12 animate-spin border-4 border-purple-500/30 border-t-purple-500 rounded-full" />
            <h2 className="text-xl font-bold text-purple-200">Loading Comic</h2>
            <p className="text-sm text-purple-400">Please wait while we fetch your comic...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950 to-black text-white p-6 flex flex-col">
      <div className="max-w-4xl mx-auto">
        <ComicResult
          title={comicData.title || "Untitled Comic"}
          summary={comicData.summary}
          imageUrls={comicData.imageUrls}
          isFromCache={comicData.fromCache}
          standalone
          url={comicData.url}
          createdAt={comicData.createdAt}
          summaryPrompt={comicData.summaryPrompt}
          imagePrompt={comicData.imagePrompt}
        />
      </div>
      <Footer />
    </div>
  );
}
