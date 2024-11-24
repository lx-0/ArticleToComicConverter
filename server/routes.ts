import type { Express } from "express";
import { db } from "../db";
import { comicGenerations } from "@db/schema";
import { eq } from "drizzle-orm";
import { DEFAULT_PROMPTS } from "./constants";
import { ComicService } from "./services/comic";
import crypto from "crypto";
import { Request, Response } from "express";

export function registerRoutes(app: Express) {
  app.post("/api/comic", async (req, res) => {
    try {
      const { url, numParts, summaryPrompt, imagePrompt } = req.body;
      const cacheId = crypto
        .createHash("md5")
        .update(
          `${url}-${numParts}-${summaryPrompt || ""}-${imagePrompt || ""}`,
        )
        .digest("hex");

      // Check cache
      const existing = await db.query.comicGenerations.findFirst({
        where: eq(comicGenerations.cacheId, cacheId),
      });

      if (existing) {
        return res.json({ cacheId });
      }

      // Create new generation
      await ComicService.initializeGeneration(url, numParts, cacheId);

      // Start processing in background
      ComicService.processComic(
        cacheId,
        url,
        numParts,
        summaryPrompt,
        imagePrompt,
      ).catch(console.error);

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

      const steps = generation.steps || [];
      const isComplete = steps.every((step) => step.status === "complete");
      
      // Only mark as fromCache if it was loaded from cache in the initial request
      const fromCache = isComplete && steps[0]?.result === "Retrieved from cache";

      res.json({
        ...generation,
        fromCache,
        steps,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch comic generation" });
    }
  });
  // Add endpoint to get default prompts
  app.get("/api/prompts/defaults", (_req: Request, res: Response) => {
    res.json(DEFAULT_PROMPTS);
  });
}
