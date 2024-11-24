import { pgTable, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

const StepStatus = z.enum(["pending", "in-progress", "complete", "error"]);

const Step = z.object({
  step: z.string(),
  status: StepStatus,
  result: z.string().optional(),
  content: z.object({
    type: z.enum(["text", "image"]),
    data: z.string()
  }).optional()
});

export const comicGenerations = pgTable("comic_generations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  url: text("url").notNull(),
  numParts: integer("num_parts").notNull(),
  cacheId: text("cache_id").unique().notNull(),
  steps: jsonb("steps").$type<z.infer<typeof Step>[]>().default([]),
  summary: jsonb("summary").$type<string[]>().default([]),
  imageUrls: jsonb("image_urls").$type<string[]>().default([]),
  summaryPrompt: text("summary_prompt").default(
    'You are a comic book artist and storyteller. Break down the given article into ${numParts} parts and create both a summary and an image generation prompt for each part. Generate JSON in this format: { "parts": [{ "summary": "string", "prompt": "string" }] }'
  ),
  imagePrompt: text("image_prompt").default(
    'Create a comic panel style image: ${prompt}'
  ),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertComicGenerationSchema = createInsertSchema(comicGenerations);
export const selectComicGenerationSchema = createSelectSchema(comicGenerations);
export type InsertComicGeneration = z.infer<typeof insertComicGenerationSchema>;
export type ComicGeneration = z.infer<typeof selectComicGenerationSchema>;

// Export types for use in the application
export type Step = z.infer<typeof Step>;
export type StepStatus = z.infer<typeof StepStatus>;
