import OpenAI from "openai";
import { DEFAULT_PROMPTS } from '../constants';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateSummaryAndPrompts(
  text: string,
  numParts: number,
  language: string = "English",
  summaryPrompt?: string,
): Promise<{ title: string; summaries: string[]; prompts: string[] }> {
  const finalPrompt = summaryPrompt?.replace('${numParts}', String(numParts))
    .replace('${language}', language) || 
    DEFAULT_PROMPTS.summary
      .replace('${numParts}', String(numParts))
      .replace('${language}', language);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: finalPrompt,
      },
      {
        role: "user",
        content: text,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("No content received from OpenAI");
  }
  
  const result = JSON.parse(content);
  return {
    title: result.title || "Untitled Comic",
    summaries: result.parts.map((p: any) => p.summary),
    prompts: result.parts.map((p: any) => p.prompt),
  };
}

export async function generateImage(
  prompt: string,
  imagePromptTemplate?: string,
): Promise<{ url: string }> {
  const finalPrompt = (imagePromptTemplate || DEFAULT_PROMPTS.image).replace('${prompt}', prompt);

  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: finalPrompt,
    n: 1,
    size: "1024x1024",
    quality: "standard",
  });

  const imageUrl = response.data[0].url;
  if (!imageUrl) {
    throw new Error("No image URL received from OpenAI");
  }
  return { url: imageUrl };
}
