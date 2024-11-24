import { db } from "../../db";
import { comicGenerations } from "@db/schema";
import { eq } from "drizzle-orm";
import { scrapeArticle } from "./scraper";
import { generateSummaryAndPrompts, generateImage } from "./openai";
import type { ComicGeneration } from "@db/schema";

export class ComicService {
  private static async updateGeneration(
    cacheId: string,
    updates: Partial<Omit<typeof comicGenerations.$inferInsert, "id">>,
  ): Promise<void> {
    await db
      .update(comicGenerations)
      .set(updates)
      .where(eq(comicGenerations.cacheId, cacheId));
  }

  private static async updateStep(
    cacheId: string,
    stepKey: string,
    status: "pending" | "in-progress" | "complete" | "error",
    result?: string,
  ): Promise<ComicGeneration["steps"]> {
    const generation = await db.query.comicGenerations.findFirst({
      where: eq(comicGenerations.cacheId, cacheId),
    });

    if (!generation) {
      throw new Error("Comic generation not found");
    }

    if (!generation.steps) {
      throw new Error("Steps array is missing");
    }

    const steps = [...generation.steps];
    const stepIndex = steps.findIndex((s) => s.step === stepKey);
    if (stepIndex === -1) {
      throw new Error(`Invalid step key: ${stepKey}`);
    }

    steps[stepIndex] = { ...steps[stepIndex], status, result };

    // If step completed successfully, update the next step's status
    if (status === "complete" && stepIndex < steps.length - 1) {
      steps[stepIndex + 1].status = "pending";
    }

    await this.updateGeneration(cacheId, { steps });
    return steps;
  }

  private static getInitialSteps(numParts: number): ComicGeneration["steps"] {
    const baseSteps = [
      { step: "Checking Cache", status: "pending" as const },
      { step: "Validating URL", status: "pending" as const },
      { step: "Downloading Article Content", status: "pending" as const },
      { step: "Generating Summary", status: "pending" as const },
    ];

    const partSteps = Array.from({ length: numParts }).map((_, i) => ({
      step: `Generating Image for Part ${i + 1}`,
      status: "pending" as const,
    }));

    const finalSteps = [
      { step: "Finalizing Comic", status: "pending" as const },
    ];

    return [...baseSteps, ...partSteps, ...finalSteps];
  }

  static async initializeGeneration(
    url: string,
    numParts: number,
    cacheId: string,
  ) {
    const initialSteps = ComicService.getInitialSteps(numParts);

    await db.insert(comicGenerations).values({
      url,
      numParts,
      cacheId,
      steps: JSON.parse(JSON.stringify(initialSteps)),
      summary: [],
      imageUrls: [],
      summaryPrompt: undefined,
      imagePrompt: undefined,
    });

    return initialSteps;
  }

  static async processComic(
    cacheId: string,
    url: string,
    numParts: number,
    summaryPrompt?: string,
    imagePrompt?: string,
  ) {
    // Start the chain of promises
    return Promise.resolve()
      .then(async () => {
        // Check cache step
        await this.updateStep(cacheId, "Checking Cache", "in-progress");
        await this.updateStep(cacheId, "Checking Cache", "complete", "Cache check completed");
      })
      .then(async () => {
        // Validate URL step
        await this.updateStep(cacheId, "Validating URL", "in-progress");
        try {
          new URL(url);
          await this.updateStep(cacheId, "Validating URL", "complete", "URL validated successfully");
        } catch {
          throw new Error("Invalid URL provided");
        }
      })
      .then(async () => {
        // Download and process article content
        await this.updateStep(cacheId, "Downloading Article Content", "in-progress");
        const articleText = await scrapeArticle(url);
        await this.updateStep(cacheId, "Downloading Article Content", "complete", "Article downloaded and processed");
        return articleText;
      })
      .then(async (articleText) => {
        // Generate summary and prompts
        await this.updateStep(cacheId, "Generating Summary", "in-progress");
        const { summaries, prompts } = await generateSummaryAndPrompts(articleText, numParts, summaryPrompt);
        await this.updateStep(cacheId, "Generating Summary", "complete", "Generated summaries and prompts");
        await this.updateGeneration(cacheId, { summary: summaries });
        return prompts;
      })
      .then(async (prompts) => {
        // Process each part
        const imageUrls: string[] = [];
        for (let i = 0; i < numParts; i++) {
          const partNum = i + 1;
          
          await this.updateStep(cacheId, `Generating Image for Part ${partNum}`, "in-progress");
          const { url: imageUrl } = await generateImage(prompts[i], imagePrompt);
          imageUrls.push(imageUrl);
          await this.updateStep(cacheId, `Generating Image for Part ${partNum}`, "complete", "Generated comic panel");
        }
        return imageUrls;
      })
      .then(async (imageUrls) => {
        // Finalize
        await this.updateStep(cacheId, "Finalizing Comic", "in-progress");
        await this.updateGeneration(cacheId, { imageUrls });
        await this.updateStep(cacheId, "Finalizing Comic", "complete", "Comic generation completed");
      })
      .catch(async (error: unknown) => {
        console.error("Error processing comic:", error);
        const generation = await db.query.comicGenerations.findFirst({
          where: eq(comicGenerations.cacheId, cacheId),
        });

        if (generation?.steps) {
          const currentStepObj = generation.steps.find(s => s.status === "in-progress");
          if (currentStepObj) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            await this.updateStep(cacheId, currentStepObj.step, "error", `Error: ${errorMessage}`);
          }
        }
        throw error;
      });
  }

  static async regenerateComic(cacheId: string) {
    const generation = await db.query.comicGenerations.findFirst({
      where: eq(comicGenerations.cacheId, cacheId),
    });

    if (!generation) {
      throw new Error("Comic generation not found");
    }

    // Reset steps and results
    const initialSteps = this.getInitialSteps(generation.numParts);
    await this.updateGeneration(cacheId, {
      steps: JSON.parse(JSON.stringify(initialSteps)),
      summary: [],
      imageUrls: [],
    });

    // Start processing with promises
    Promise.resolve()
      .then(() => {
        return this.processComic(
          cacheId,
          generation.url,
          generation.numParts,
          generation.summaryPrompt || undefined,
          generation.imagePrompt || undefined
        );
      })
      .catch(console.error);
  }
}
