import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

interface Props {
  title: string;
  summary: string[];
  imageUrls: string[];
  onRegenerate: () => void;
  isFromCache?: boolean;
}

export function ComicResult({ title, summary, imageUrls, onRegenerate, isFromCache }: Props) {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-purple-200">{title}</h2>
            <p className="text-sm text-purple-400">Your Comic Story</p>
          </div>
          {isFromCache && (
            <p className="text-sm text-purple-400 mt-1">
              Loaded from cache
            </p>
          )}
        </div>
        <Button
          onClick={onRegenerate}
          variant="outline"
          className="border-purple-500/30"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Regenerate
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {summary.map((text, index) => (
          <Card
            key={index}
            className="bg-black/50 border-purple-500/30 overflow-hidden"
          >
            <div className="flex flex-col gap-4 p-4">
              <div className="relative aspect-square">
                <img
                  src={imageUrls[index]}
                  alt={`Comic panel ${index + 1}`}
                  className="rounded-lg object-cover w-full h-full"
                />
              </div>
              <div className="space-y-2">
                <p className="text-purple-200 text-sm">{text}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
