import { pgTable, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

const StepStatus = z.enum(["pending", "in-progress", "complete", "error"]);

const Step = z.object({
  step: z.string(),
  status: StepStatus,
  result: z.string().optional(),
  content: z
    .object({
      type: z.enum(["text", "image"]),
      data: z.string(),
    })
    .optional(),
});

export const comicGenerations = pgTable("comic_generations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  url: text("url").notNull(),
  numParts: integer("num_parts").notNull(),
  cacheId: text("cache_id").unique().notNull(),
  title: text("title").default(""),
  steps: jsonb("steps").$type<z.infer<typeof Step>[]>().default([]),
  summary: jsonb("summary").$type<string[]>().default([]),
  imageUrls: jsonb("image_urls").$type<string[]>().default([]),
  imageData: jsonb("image_data")
    .$type<Array<{ mime: string; data: string }>>()
    .default([]),
  summaryPrompt: text("summary_prompt"),
  imagePrompt: text("image_prompt"),
  language: text("language").default("English"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertComicGenerationSchema = createInsertSchema(comicGenerations);
export const selectComicGenerationSchema = createSelectSchema(comicGenerations);
export type InsertComicGeneration = z.infer<typeof insertComicGenerationSchema>;
export type ComicGeneration = z.infer<typeof selectComicGenerationSchema>;

// Export types for use in the application
export type Step = z.infer<typeof Step>;
export type StepStatus = z.infer<typeof StepStatus>;

export function isSteps(value: any): value is Step[] {
  return (
    value !== undefined &&
    value !== null &&
    Array.isArray(value) &&
    (value.length === 0 || value.every(isStep))
  );
}

export function isStep(value: any): value is Step {
  return (
    value !== undefined &&
    value !== null &&
    "step" in value &&
    typeof "step" === "string" &&
    "status" in value
  );
}
