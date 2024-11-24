import { db } from "../../db";
import { comicGenerations } from "@db/schema";
import { eq } from "drizzle-orm";
import { scrapeArticle } from "./scraper";
import { generateSummaryAndPrompts, generateImage } from "./openai";
import type { ComicGeneration } from "@db/schema";

export class ComicService {
  private static async updateGeneration(
    cacheId: string,
    updates: Partial<typeof comicGenerations.$inferInsert>
  ): Promise<void> {
    await db
      .update(comicGenerations)
      .set(updates)
      .where(eq(comicGenerations.cacheId, cacheId));
  }

  private static async updateStep(
    cacheId: string,
    stepIndex: number,
    status: "pending" | "in-progress" | "complete" | "error",
    result?: string
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
    const stepObj = steps[stepIndex];
    if (!stepObj) {
      throw new Error(`Invalid step index: ${stepIndex}`);
    }

    steps[stepIndex] = { ...stepObj, status, result };

    // If step completed successfully, initialize next step
    if (status === "complete" && stepIndex < steps.length - 1) {
      steps[stepIndex + 1] = {
        step: this.getStepName(stepIndex + 1, generation.numParts),
        status: "pending",
      };
    }

    await this.updateGeneration(cacheId, { steps });
    return steps;
  }

  private static getStepName(index: number, totalParts: number): string {
    const stepNames = [
      "Fetching Article Content",
      "Analyzing Article Structure",
      "Generating Summary",
      ...Array.from({ length: totalParts * 2 }, (_, i) =>
        i % 2 === 0
          ? `Creating Prompt for Part ${Math.floor(i / 2) + 1}`
          : `Generating Image for Part ${Math.floor(i / 2) + 1}`
      ),
      "Assembling Comic Layout",
    ];
    return stepNames[index] || `Step ${index + 1}`;
  }

  static async initializeGeneration(
    url: string,
    numParts: number,
    cacheId: string
  ) {
    const initialSteps = [
      {
        step: this.getStepName(0, numParts),
        status: "pending" as const,
      },
    ];

    await db.insert(comicGenerations).values({
      url,
      numParts,
      cacheId,
      steps: initialSteps,
      summary: [],
      imageUrls: [],
    });

    return initialSteps;
  }

  static async processComic(cacheId: string, url: string, numParts: number) {
    try {
      // Step 1: Fetch article
      await this.updateStep(0, "in-progress", undefined);
      const articleText = await scrapeArticle(url);
      await this.updateStep(0, "complete", "Article content retrieved successfully");

      // Step 2: Analyze structure
      await this.updateStep(1, "in-progress", undefined);
      // Artificial delay to show progress
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.updateStep(1, "complete", "Article structure analyzed");

      // Step 3: Generate summaries and prompts
      await this.updateStep(2, "in-progress", undefined);
      const { summaries, prompts } = await generateSummaryAndPrompts(
        articleText,
        numParts
      );
      await this.updateStep(2, "complete", "Generated summaries and prompts");

      // Update summaries in database
      await this.updateGeneration(cacheId, { summary: summaries });

      // Generate images for each part
      const imageUrls: string[] = [];
      for (let i = 0; i < numParts; i++) {
        const promptStepIndex = 3 + i * 2;
        const imageStepIndex = promptStepIndex + 1;

        // Prompt creation step
        await this.updateStep(promptStepIndex, "in-progress", undefined);
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
        await this.updateStep(promptStepIndex, "complete", `Created prompt for part ${i + 1}`);

        // Image generation step
        await this.updateStep(imageStepIndex, "in-progress", undefined);
        const { url: imageUrl } = await generateImage(prompts[i]);
        imageUrls.push(imageUrl);
        await this.updateStep(
          imageStepIndex,
          "complete",
          `Generated image for part ${i + 1}`
        );
      }

      // Final assembly step
      const finalStepIndex = 3 + numParts * 2;
      const finalSteps = await this.updateStep(finalStepIndex, "in-progress", undefined);
      await this.updateGeneration(cacheId, { imageUrls });
      await this.updateStep(
        finalStepIndex,
        "complete",
        "Comic assembly completed"
      );

    } catch (error: unknown) {
      console.error("Error processing comic:", error);
      const generation = await db.query.comicGenerations.findFirst({
        where: eq(comicGenerations.cacheId, cacheId),
      });

      if (generation?.steps) {
        const currentStep = generation.steps.findIndex(
          (s) => s.status === "in-progress"
        );
        if (currentStep !== -1) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          await this.updateStep(
            currentStep,
            "error",
            `Error: ${errorMessage}`
          );
        }
      }
      throw error;
    }
  }

  static async regenerateComic(cacheId: string) {
    const generation = await db.query.comicGenerations.findFirst({
      where: eq(comicGenerations.cacheId, cacheId),
    });

    if (!generation) {
      throw new Error("Comic generation not found");
    }

    // Reset steps and results
    const initialSteps = [
      {
        step: this.getStepName(0, generation.numParts),
        status: "pending" as const,
      },
    ];

    await this.updateGeneration(cacheId, {
      steps: initialSteps,
      summary: [],
      imageUrls: [],
    });

    // Start new processing
    await this.processComic(cacheId, generation.url, generation.numParts);
  }
}
