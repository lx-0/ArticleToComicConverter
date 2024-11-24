import type { Express } from "express";
import { db } from "../db";
import { comicGenerations } from "@db/schema";
import { eq } from "drizzle-orm";
import { scrapeArticle } from "./services/scraper";
import { generateSummaryAndPrompts, generateImage } from "./services/openai";
import { ComicService } from "./services/comic";
import crypto from "crypto";

export function registerRoutes(app: Express) {
  app.post("/api/comic", async (req, res) => {
    try {
      const { url, numParts, summaryPrompt, imagePrompt } = req.body;
      const cacheId = crypto
        .createHash("md5")
        .update(`${url}-${numParts}-${summaryPrompt || ""}-${imagePrompt || ""}`)
        .digest("hex");

      // Check cache
      const existing = await db.query.comicGenerations.findFirst({
        where: eq(comicGenerations.cacheId, cacheId),
      });

      if (existing) {
        return res.json({ cacheId });
      }

      // Create new generation
      await db.insert(comicGenerations).values({
        url,
        numParts,
        cacheId,
        steps: [{ step: "Fetching Article Content", status: "pending" }],
        summary: [],
        imageUrls: [],
      });

      // Start processing in background
      ComicService.processComic(cacheId, url, numParts, summaryPrompt, imagePrompt).catch(console.error);

      res.json({ cacheId });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate comic" });
    }
  });

  app.post("/api/comic/:cacheId/regenerate", async (req, res) => {
    try {
      const { cacheId } = req.params;
      await ComicService.regenerateComic(cacheId);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to regenerate comic" });
    }
  });

  app.get("/api/comic/:cacheId", async (req, res) => {
    try {
      const { cacheId } = req.params;
      const generation = await db.query.comicGenerations.findFirst({
        where: eq(comicGenerations.cacheId, cacheId),
      });

      if (!generation) {
        return res.status(404).json({ error: "Not found" });
      }

      // Only mark as fromCache if the generation is complete
      const isComplete = generation.steps.every(step => step.status === "complete");
      
      res.json({
        ...generation,
        fromCache: isComplete,
        steps: isComplete ? [] : generation.steps // Only show steps for in-progress generations
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch comic generation" });
    }
  });
}

async function processComic(cacheId: string, url: string, numParts: number) {
  const updateStep = async (
    stepIndex: number,
    status: "pending" | "in-progress" | "complete" | "error",
    result?: string
  ) => {
    const generation = await db.query.comicGenerations.findFirst({
      where: eq(comicGenerations.cacheId, cacheId),
    });
    
    if (!generation?.steps) {
      console.error("Comic generation or steps not found");
      return;
    }

    const steps = [...generation.steps];
    const step = steps[stepIndex];
    if (!step) {
      console.error(`Invalid step index: ${stepIndex}`);
      return;
    }

    steps[stepIndex] = { ...step, status, result };
    
    if (status === "complete" && stepIndex < steps.length - 1) {
      steps[stepIndex + 1] = {
        step: getStepName(stepIndex + 1),
        status: "pending",
      };
    }

    await db
      .update(comicGenerations)
      .set({ steps })
      .where(eq(comicGenerations.cacheId, cacheId));
  };

  try {
    // Step 1: Fetch article
    await updateStep(0, "in-progress");
    const articleText = await scrapeArticle(url);
    await updateStep(0, "complete", "Article fetched successfully");

    // Step 2: Generate summaries and prompts
    await updateStep(1, "in-progress");
    const { summaries, prompts } = await generateSummaryAndPrompts(
      articleText,
      numParts,
    );
    await updateStep(1, "complete", "Generated summaries and prompts");

    // Update summaries in database
    await db
      .update(comicGenerations)
      .set({ summary: summaries })
      .where(eq(comicGenerations.cacheId, cacheId));

    // Generate images for each part
    const imageUrls: string[] = [];
    for (let i = 0; i < prompts.length; i++) {
      await updateStep(2 + i, "in-progress");
      const { url } = await generateImage(prompts[i]);
      imageUrls.push(url);
      await updateStep(2 + i, "complete", "Generated image");
    }

    // Update image URLs in database
    await db
      .update(comicGenerations)
      .set({ imageUrls })
      .where(eq(comicGenerations.cacheId, cacheId));

  } catch (error) {
    console.error("Error processing comic:", error);
    const generation = await db.query.comicGenerations.findFirst({
      where: eq(comicGenerations.cacheId, cacheId),
    });
    
    if (generation?.steps) {
      const currentStep = generation.steps.findIndex(
        (s) => s.status === "in-progress",
      );
      if (currentStep !== -1) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await updateStep(currentStep, "error", errorMessage);
      }
    }
  }
}

function getStepName(index: number): string {
  if (index === 0) return "Fetching Article Content";
  if (index === 1) return "Analyzing and Generating Prompts";
  return `Generating Image ${index - 1}`;
}
