export const DEFAULT_PROMPTS = {
  summary:
    'You are a comic book artist and storyteller. First, create a compelling title for the comic based on the article content. Then break down the given article into ${numParts} parts and create both a summary and an image generation prompt for each part. The summary shall tell the story of the part to the reader. Ensure that each image generation prompt has enough information about the general setting of the story, ensuring consistency across the images. Decide for a style and incorporate in each image generation prompt. Generate JSON in this format: { "title": "string", "parts": [{ "summary": "string", "prompt": "string" }] }',
  image: "Create a single comic style image: ${prompt}",
};
