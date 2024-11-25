import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { getComicGeneration } from "@/lib/api";
import { ComicResult } from "@/components/ComicResult";
import { type Step, isSteps } from "@db/schema";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

export default function Comic() {
  const { cacheId } = useParams();
  const { data: comicData } = useQuery({
    queryKey: ["comic", cacheId],
    queryFn: () => getComicGeneration(cacheId!),
    enabled: !!cacheId,
  });

  const [, navigate] = useLocation();

  if (
    !comicData?.steps ||
    (isSteps(comicData.steps) &&
      !(comicData.steps as Step[]).every(
        (step: Step) => step.status === "complete",
      ))
  ) {
    const inProgressStep = isSteps(comicData?.steps)
      ? comicData.steps.find((step) => step.status === "in-progress")
      : undefined;
    const errorStep = isSteps(comicData?.steps)
      ? comicData?.steps?.find((step) => step.status === "error")
      : undefined;

    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-purple-950 to-black text-white px-4 sm:px-6 py-6 flex items-center justify-center">
        <div className="w-full max-w-md mx-auto text-center space-y-4">
          <div className="mx-auto w-12 h-12 animate-spin border-4 border-purple-500/30 border-t-purple-500 rounded-full" />
          <h2 className="text-xl font-bold text-purple-200">
            {errorStep ? "Generation Error" : "Loading Comic"}
          </h2>
          <p className="text-sm text-purple-400">
            {errorStep ? (
              <span className="text-red-400">{errorStep.result}</span>
            ) : inProgressStep ? (
              `Currently ${inProgressStep.step.toLowerCase()}...`
            ) : (
              "Please wait while we fetch your comic..."
            )}
          </p>
          {errorStep && (
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="border-purple-500/30 mt-4"
            >
              Back to Home
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950 to-black text-white p-6 flex flex-col">
      <div className="max-w-4xl mx-auto">
        <ComicResult
          title={comicData.title || "Untitled Comic"}
          summary={comicData.summary as string[]}
          imageUrls={comicData.imageUrls as string[]}
          isFromCache={comicData.fromCache}
          standalone
          url={comicData.url}
          createdAt={comicData.createdAt ?? undefined}
          summaryPrompt={comicData.summaryPrompt ?? undefined}
          imagePrompt={comicData.imagePrompt ?? undefined}
          cacheId={comicData.cacheId}
        />
      </div>
      <Footer />
    </div>
  );
}
