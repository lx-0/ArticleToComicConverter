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
    content?: { type: "text" | "image"; data: string }
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

    steps[stepIndex] = { ...steps[stepIndex], status, result, content };

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
    const maxRetries = 3;

    // Start the chain of promises
    return Promise.resolve()
      .then(async () => {
        // Check cache step
        await this.updateStep(cacheId, "Checking Cache", "in-progress");
        const existing = await db.query.comicGenerations.findFirst({
          where: eq(comicGenerations.cacheId, cacheId),
        });
        if (existing?.steps?.every(step => step.status === "complete")) {
          await this.updateStep(cacheId, "Checking Cache", "complete", "Retrieved from cache");
          return existing;
        }
        await this.updateStep(cacheId, "Checking Cache", "complete", "New generation started");
      })
      .then(async (cached) => {
        if (cached) return cached;

        // Validate URL step
        await this.updateStep(cacheId, "Validating URL", "in-progress");
        try {
          new URL(url);
          const response = await fetch(url, { method: 'HEAD' });
          const contentType = response.headers.get('content-type');
          if (!contentType?.includes('text/html')) {
            throw new Error('URL must point to an HTML page');
          }
          await this.updateStep(cacheId, "Validating URL", "complete", "URL validated successfully");
        } catch (error) {
          throw new Error(error instanceof Error ? error.message : "Invalid URL provided");
        }
      })
      .then(async (cached) => {
        if (cached) return cached;

        // Download and process article content
        await this.updateStep(cacheId, "Downloading Article Content", "in-progress");
        const articleText = await scrapeArticle(url);
        if (!articleText || articleText.length < 100) {
          throw new Error('Article content too short or invalid');
        }
        const cleanText = articleText.replace(/\s+/g, ' ').trim();
        await this.updateStep(
          cacheId,
          "Downloading Article Content",
          "complete",
          "Article downloaded and processed",
          { type: "text", data: cleanText }
        );
        return cleanText;
      })
      .then(async (articleText) => {
        if (typeof articleText !== 'string') return articleText; // Handle cached case

        // Generate summary and prompts
        await this.updateStep(cacheId, "Generating Summary", "in-progress");
        let attempt = 0;
        while (attempt < maxRetries) {
          try {
            const { summaries, prompts } = await generateSummaryAndPrompts(
              articleText,
              numParts,
              summaryPrompt
            );
            if (!summaries.length || !prompts.length) {
              throw new Error('Invalid summary or prompts generated');
            }
            // Validate each summary and prompt
            summaries.forEach((summary, i) => {
              if (!summary || summary.length < 10) {
                throw new Error(`Invalid summary for part ${i + 1}`);
              }
            });
            await this.updateStep(
              cacheId,
              "Generating Summary",
              "complete",
              "Generated summaries and prompts",
              { 
                type: "text", 
                data: JSON.stringify({
                  summaries,
                  prompts
                }, null, 2)
              }
            );
            await this.updateGeneration(cacheId, { summary: summaries });
            return prompts;
          } catch (error) {
            attempt++;
            if (attempt === maxRetries) throw error;
            await this.updateStep(cacheId, "Generating Summary", "in-progress", `Retry attempt ${attempt}/${maxRetries}`);
          }
        }
      })
      .then(async (prompts) => {
        if (!Array.isArray(prompts)) return prompts; // Handle cached case

        // Process each part
        const imageUrls: string[] = [];
        for (let i = 0; i < numParts; i++) {
          const partNum = i + 1;
          let attempt = 0;
          
          while (attempt < maxRetries) {
            try {
              await this.updateStep(cacheId, `Generating Image for Part ${partNum}`, "in-progress");
              const { url: imageUrl } = await generateImage(prompts[i], imagePrompt);
              if (!imageUrl) {
                throw new Error('Invalid image URL received');
              }
              
              // Verify image is accessible
              const imgResponse = await fetch(imageUrl, { method: 'HEAD' });
              if (!imgResponse.ok) {
                throw new Error('Generated image not accessible');
              }
              
              imageUrls.push(imageUrl);
              await this.updateStep(
                cacheId,
                `Generating Image for Part ${partNum}`,
                "complete",
                "Generated comic panel",
                { type: "image", data: imageUrl }
              );
              break;
            } catch (error) {
              attempt++;
              if (attempt === maxRetries) throw error;
              await this.updateStep(
                cacheId,
                `Generating Image for Part ${partNum}`,
                "in-progress",
                `Retry attempt ${attempt}/${maxRetries}`
              );
            }
          }
        }
        return imageUrls;
      })
      .then(async (result) => {
        // Handle cached case
        if (result && !Array.isArray(result)) return;

        const imageUrls = result as string[];
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
