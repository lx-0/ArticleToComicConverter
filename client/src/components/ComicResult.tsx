import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { RefreshCw, X } from "lucide-react";
import { useState } from "react";

interface Props {
  title: string;
  summary: string[];
  imageUrls: string[];
  onRegenerate: () => void;
  isFromCache?: boolean;
}

export function ComicResult({ title, summary, imageUrls, onRegenerate, isFromCache }: Props) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
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
                  className="rounded-lg object-cover w-full h-full cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedImage(imageUrls[index])}
                />
              </div>
              <div className="space-y-2">
                <p className="text-purple-200 text-sm">{text}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] bg-black/95 border-purple-500/30">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 text-purple-200 hover:text-purple-100 hover:bg-purple-500/20"
            onClick={() => setSelectedImage(null)}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="relative w-full h-full flex items-center justify-center mt-6">
            <img
              src={selectedImage || ''}
              alt="Full size comic panel"
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
