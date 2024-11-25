import type { Express, Request, Response } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db } from "db";
import { comicGenerations } from "@db/schema";
import { DEFAULT_PROMPTS } from "./constants";
import { ComicService } from "./services/comic";
import crypto from "crypto";

export function registerRoutes(app: Express) {
  // Generate comic
  app.post("/api/comic", async (req, res) => {
    try {
      const { url, numParts, summaryPrompt, imagePrompt, language } = req.body;
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
      await ComicService.initializeGeneration(
        url,
        numParts,
        cacheId,
        summaryPrompt,
        imagePrompt,
      );

      // Start processing in background
      ComicService.processComic(
        cacheId,
        url,
        numParts,
        summaryPrompt,
        imagePrompt,
        language,
      ).catch(console.error);

      res.json({ cacheId });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate comic" });
    }
  });

  // Regenerate comic
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

  // Get comic generation by cache ID
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
      const fromCache =
        isComplete && steps[0]?.result === "Retrieved from cache";

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

  // Get default prompts
  app.get("/api/prompts/defaults", (_req: Request, res: Response) => {
    res.json(DEFAULT_PROMPTS);
  });

  // Get recent comics
  app.get("/api/comics/recent", async (_req, res) => {
    try {
      const recentComics = await db
        .select({
          cacheId: comicGenerations.cacheId,
          title: comicGenerations.title,
          createdAt: comicGenerations.createdAt,
        })
        .from(comicGenerations)
        .orderBy(desc(comicGenerations.createdAt))
        .limit(10);

      res.json(recentComics);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch recent comics" });
    }
  });

  // Serve images from database
  app.get("/api/images/:cacheId/:index", async (req, res) => {
    try {
      const { cacheId, index } = req.params;
      const comic = await db.query.comicGenerations.findFirst({
        where: eq(comicGenerations.cacheId, cacheId),
      });

      if (!comic?.imageData?.[Number(index)]) {
        return res.status(404).send("Image not found");
      }

      const { mime, data } = comic.imageData[Number(index)];
      const buffer = Buffer.from(data, "base64");
      res.setHeader("Content-Type", mime);
      res.send(buffer);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error fetching image");
    }
  });

  // Add delete comic endpoint
  app.post("/api/comic/:cacheId/delete", async (req, res) => {
    try {
      const { cacheId } = req.params;
      const { password } = req.body;

      if (password !== "hackerman") {
        return res.status(401).json({ error: "Invalid password" });
      }

      await db.delete(comicGenerations)
        .where(eq(comicGenerations.cacheId, cacheId));

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete comic" });
    }
  });
}
