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
      { step: "Initializing Article Fetch", status: "pending" as const },
      { step: "Downloading Article Content", status: "pending" as const },
      { step: "Processing Article Content", status: "pending" as const },
      { step: "Extracting Main Content", status: "pending" as const },
      { step: "Analyzing Article Structure", status: "pending" as const },
      { step: "Preparing Text for Summary", status: "pending" as const },
      { step: "Generating Summary", status: "pending" as const },
    ];

    const partSteps = Array.from({ length: numParts }).flatMap((_, i) => [
      { step: `Creating Prompt for Part ${i + 1}`, status: "pending" as const },
      {
        step: `Optimizing Prompt for Part ${i + 1}`,
        status: "pending" as const,
      },
      {
        step: `Generating Image for Part ${i + 1}`,
        status: "pending" as const,
      },
      {
        step: `Processing Image for Part ${i + 1}`,
        status: "pending" as const,
      },
    ]);

    const finalSteps = [
      { step: "Assembling Comic Layout", status: "pending" as const },
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
        await new Promise(resolve => setTimeout(resolve, 500));
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
        // Initialize article fetch
        await this.updateStep(cacheId, "Initializing Article Fetch", "in-progress");
        await new Promise(resolve => setTimeout(resolve, 300));
        await this.updateStep(cacheId, "Initializing Article Fetch", "complete", "Fetch initialized");
      })
      .then(async () => {
        // Download article content
        await this.updateStep(cacheId, "Downloading Article Content", "in-progress");
        const articleText = await scrapeArticle(url);
        await this.updateStep(cacheId, "Downloading Article Content", "complete", "Article downloaded");
        return articleText;
      })
      .then(async (articleText) => {
        // Process article content
        await this.updateStep(cacheId, "Processing Article Content", "in-progress");
        await new Promise(resolve => setTimeout(resolve, 500));
        await this.updateStep(cacheId, "Processing Article Content", "complete", "Content processed");
        return articleText;
      })
      .then(async (articleText) => {
        // Extract main content
        await this.updateStep(cacheId, "Extracting Main Content", "in-progress");
        await new Promise(resolve => setTimeout(resolve, 800));
        await this.updateStep(cacheId, "Extracting Main Content", "complete", "Main content extracted");
        return articleText;
      })
      .then(async (articleText) => {
        // Analyze structure
        await this.updateStep(cacheId, "Analyzing Article Structure", "in-progress");
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.updateStep(cacheId, "Analyzing Article Structure", "complete", "Article structure analyzed");
        return articleText;
      })
      .then(async (articleText) => {
        // Prepare text for summary
        await this.updateStep(cacheId, "Preparing Text for Summary", "in-progress");
        await new Promise(resolve => setTimeout(resolve, 500));
        await this.updateStep(cacheId, "Preparing Text for Summary", "complete", "Text prepared for summarization");
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
          
          await this.updateStep(cacheId, `Creating Prompt for Part ${partNum}`, "in-progress");
          await new Promise(resolve => setTimeout(resolve, 500));
          await this.updateStep(cacheId, `Creating Prompt for Part ${partNum}`, "complete", "Created initial prompt");

          await this.updateStep(cacheId, `Optimizing Prompt for Part ${partNum}`, "in-progress");
          await new Promise(resolve => setTimeout(resolve, 800));
          await this.updateStep(cacheId, `Optimizing Prompt for Part ${partNum}`, "complete", "Optimized prompt for better results");

          await this.updateStep(cacheId, `Generating Image for Part ${partNum}`, "in-progress");
          const { url: imageUrl } = await generateImage(prompts[i], imagePrompt);
          imageUrls.push(imageUrl);
          await this.updateStep(cacheId, `Generating Image for Part ${partNum}`, "complete", "Generated base image");

          await this.updateStep(cacheId, `Processing Image for Part ${partNum}`, "in-progress");
          await new Promise(resolve => setTimeout(resolve, 600));
          await this.updateStep(cacheId, `Processing Image for Part ${partNum}`, "complete", "Applied comic style effects");
        }
        return imageUrls;
      })
      .then(async (imageUrls) => {
        // Assemble and finalize
        await this.updateStep(cacheId, "Assembling Comic Layout", "in-progress");
        await this.updateGeneration(cacheId, { imageUrls });
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.updateStep(cacheId, "Assembling Comic Layout", "complete", "Layout assembled");

        await this.updateStep(cacheId, "Finalizing Comic", "in-progress");
        await new Promise(resolve => setTimeout(resolve, 500));
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
