import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

interface Props {
  summary: string[];
  imageUrls: string[];
  onRegenerate: () => void;
  isFromCache?: boolean;
}

export function ComicResult({ summary, imageUrls, onRegenerate, isFromCache }: Props) {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-purple-200">Your Comic Story</h2>
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

      <div className="grid gap-8">
        {summary.map((text, index) => (
          <Card
            key={index}
            className="bg-black/50 border-purple-500/30 overflow-hidden"
          >
            <div className="grid md:grid-cols-2 gap-4 p-6">
              <div className="space-y-4">
                <p className="text-purple-200">{text}</p>
              </div>
              <div className="relative aspect-square">
                <img
                  src={imageUrls[index]}
                  alt={`Comic panel ${index + 1}`}
                  className="rounded-lg object-cover w-full h-full"
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
