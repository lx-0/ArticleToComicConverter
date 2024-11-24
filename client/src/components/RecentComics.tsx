import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getRecentComics } from "@/lib/api";
import type { ComicGeneration } from "@db/schema";

export function RecentComics() {
  const { data: recentComics = [] } = useQuery<ComicGeneration[]>({
    queryKey: ["recentComics"],
    queryFn: getRecentComics,
  });

  if (!recentComics.length) return null;

  return (
    <div className="border-t border-purple-500/30 mt-12 pt-8">
      <h3 className="text-lg font-medium text-purple-200 mb-4">Recent Comics</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {recentComics.map((comic) => (
          <Link key={comic.cacheId} href={`/comic/${comic.cacheId}`}>
            <div className="block p-3 bg-black/30 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-colors">
              <h4 className="text-sm font-medium text-purple-200 truncate">
                {comic.title || "Untitled Comic"}
              </h4>
              <p className="text-xs text-purple-400 mt-1">
                {comic.createdAt ? new Date(comic.createdAt).toLocaleDateString() : 'Unknown date'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
