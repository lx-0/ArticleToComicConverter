import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import {
  RefreshCw,
  Share,
  ChevronLeft,
  ChevronRight,
  Plus,
  Wand,
  PencilRuler,
} from "lucide-react";
import { useState } from "react";

interface Props {
  title: string;
  summary: string[];
  imageUrls: string[];
  onRegenerate?: () => Promise<void>;
  isFromCache?: boolean;
  standalone?: boolean;
  cacheId?: string;
  url?: string;
  createdAt?: string | Date;
  summaryPrompt?: string;
  imagePrompt?: string;
}

export function ComicResult({
  title,
  summary,
  imageUrls,
  onRegenerate,
  isFromCache,
  standalone,
  cacheId,
  url,
  createdAt,
  summaryPrompt,
  imagePrompt,
}: Props) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<{
    title: string;
    content: string;
  } | null>(null);
  const currentIndex = imageUrls.findIndex((url) => url === selectedImage);
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-purple-200">{title}</h2>
            {standalone && url && createdAt && (
              <div className="space-y-1">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-400/60 hover:text-purple-400 transition-colors block"
                >
                  {url}
                </a>
                <p className="text-sm text-purple-400/60">
                  Created on {new Date(createdAt).toLocaleDateString()}
                </p>
              </div>
            )}
            {/* <p className="text-sm text-purple-400">Your Comic Story</p> */}
            <div className="flex items-center gap-2 mt-1">
              {summaryPrompt && (
                <>
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          setSelectedPrompt({
                            title: "Summary Prompt",
                            content: summaryPrompt,
                          })
                        }
                      >
                        <PencilRuler className="h-4 w-4 text-purple-400" />
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80 bg-black/95 border-purple-500/30">
                      <p className="text-sm text-purple-200 font-mono whitespace-pre-wrap line-clamp-4">
                        {summaryPrompt}
                      </p>
                    </HoverCardContent>
                  </HoverCard>
                </>
              )}
              {imagePrompt && (
                <>
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          setSelectedPrompt({
                            title: "Image Prompt",
                            content: imagePrompt,
                          })
                        }
                      >
                        <Wand className="h-4 w-4 text-purple-400" />
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80 bg-black/95 border-purple-500/30">
                      <p className="text-sm text-purple-200 font-mono whitespace-pre-wrap line-clamp-4">
                        {imagePrompt}
                      </p>
                    </HoverCardContent>
                  </HoverCard>
                </>
              )}
            </div>
          </div>
          {isFromCache && (
            <p className="text-sm text-purple-400 mt-1">Loaded from cache</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              const url = `${window.location.origin}/comic/${cacheId}`;
              navigator.clipboard.writeText(url);
              toast({
                title: "Link copied!",
                description: "Share this link to show your comic to others.",
              });
            }}
            variant="outline"
            className="border-purple-500/30"
          >
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>

          {standalone && (
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="border-purple-500/30"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Comic
            </Button>
          )}

          {onRegenerate && (
            <Button
              onClick={onRegenerate}
              variant="outline"
              className="border-purple-500/30"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
          )}
        </div>
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

      <Dialog
        open={!!selectedImage}
        onOpenChange={() => setSelectedImage(null)}
      >
        <DialogContent className="max-w-[90vw] max-h-[90vh] bg-black/95 border-purple-500/30">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold text-purple-200">
              {title}
            </DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-full flex flex-col items-center justify-center gap-4">
            <div className="relative w-full">
              <img
                src={selectedImage || ""}
                alt="Full size comic panel"
                className="max-w-full max-h-[70vh] object-contain rounded-lg mx-auto"
              />
              {selectedImage && (
                <div className="absolute inset-y-0 inset-x-4 flex items-center justify-between pointer-events-none">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-black/50 text-purple-200 hover:text-purple-100 hover:bg-purple-500/20 pointer-events-auto"
                    onClick={() =>
                      setSelectedImage(imageUrls[currentIndex - 1])
                    }
                    disabled={currentIndex === 0}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-black/50 text-purple-200 hover:text-purple-100 hover:bg-purple-500/20 pointer-events-auto"
                    onClick={() =>
                      setSelectedImage(imageUrls[currentIndex + 1])
                    }
                    disabled={currentIndex === imageUrls.length - 1}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </div>
              )}
            </div>
            <p className="text-purple-200 text-sm max-w-prose">
              {summary[currentIndex]}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedPrompt}
        onOpenChange={() => setSelectedPrompt(null)}
      >
        <DialogContent className="max-w-2xl bg-black/95 border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-purple-200">
              {selectedPrompt?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-sm text-purple-200 font-mono whitespace-pre-wrap">
              {selectedPrompt?.content}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
