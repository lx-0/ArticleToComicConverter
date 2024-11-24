import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateSummaryAndPrompts(
  text: string,
  numParts: number,
): Promise<{ summaries: string[]; prompts: string[] }> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          `You are a comic book artist and storyteller. Break down the given article into ${numParts} parts and create both a summary and an image generation prompt for each part. Generate JSON in this format: { "parts": [{ "summary": "string", "prompt": "string" }] }`,
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
    summaries: result.parts.map((p: any) => p.summary),
    prompts: result.parts.map((p: any) => p.prompt),
  };
}

export async function generateImage(
  prompt: string,
): Promise<{ url: string }> {
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: `Create a comic panel style image: ${prompt}`,
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
