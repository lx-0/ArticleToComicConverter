import { pgTable, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const comicGenerations = pgTable("comic_generations", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  url: text("url").notNull(),
  numParts: integer("num_parts").notNull(),
  cacheId: text("cache_id").unique().notNull(),
  steps: jsonb("steps").$type<{
    step: string;
    status: "pending" | "in-progress" | "complete" | "error";
    result?: string;
  }[]>(),
  summary: jsonb("summary").$type<string[]>(),
  imageUrls: jsonb("image_urls").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertComicGenerationSchema = createInsertSchema(comicGenerations);
export const selectComicGenerationSchema = createSelectSchema(comicGenerations);
export type InsertComicGeneration = z.infer<typeof insertComicGenerationSchema>;
export type ComicGeneration = z.infer<typeof selectComicGenerationSchema>;
