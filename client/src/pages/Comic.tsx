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
    return <div>Loading...</div>;
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
        />
      </div>
      <Footer />
    </div>
  );
}
