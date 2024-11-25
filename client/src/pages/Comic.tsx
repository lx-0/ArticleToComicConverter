import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { getComicGeneration } from "@/lib/api";
import { ComicResult } from "@/components/ComicResult";
import { type Step, isSteps } from "@db/schema";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function Comic() {
  const { cacheId } = useParams();
  const { data: comicData } = useQuery({
    queryKey: ["comic", cacheId],
    queryFn: () => getComicGeneration(cacheId!),
    enabled: !!cacheId,
  });

  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

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
      <>
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
              <div className="flex items-center justify-center gap-2">
                <Button
                  onClick={() => navigate("/")}
                  variant="outline"
                  className="border-purple-500/30"
                >
                  Back to Home
                </Button>
                <Button
                  onClick={() => setShowDeleteDialog(true)}
                  variant="ghost"
                  size="icon"
                  className="opacity-30 hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <Dialog open={showDeleteDialog && !!errorStep} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="max-w-md bg-black/95 border-purple-500/30">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-purple-200">
                Delete Comic
              </DialogTitle>
              <DialogDescription className="text-sm text-purple-200">
                Enter the admin password to delete this comic.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                type="password"
                placeholder="Password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="bg-black/30 border-purple-500/30"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                  className="border-purple-500/30"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      const response = await fetch(`/api/comic/${cacheId}/delete`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ password: deletePassword }),
                      });
                      if (!response.ok) throw new Error("Invalid password");
                      toast({ title: "Comic deleted successfully" });
                      navigate("/");
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Invalid password or failed to delete comic",
                        variant: "destructive",
                      });
                    }
                    setIsDeleting(false);
                    setShowDeleteDialog(false);
                  }}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950 to-black text-white p-6 flex flex-col">
      <div className="max-w-4xl mx-auto">
        <ComicResult
          title={comicData?.title || "Untitled Comic"}
          summary={comicData?.summary as string[]}
          imageUrls={comicData?.imageUrls as string[]}
          isFromCache={comicData?.fromCache}
          standalone
          url={comicData?.url}
          createdAt={comicData?.createdAt ?? undefined}
          summaryPrompt={comicData?.summaryPrompt ?? undefined}
          imagePrompt={comicData?.imagePrompt ?? undefined}
          cacheId={comicData?.cacheId}
        />
      </div>
      <Footer />
    </div>
  );
}
