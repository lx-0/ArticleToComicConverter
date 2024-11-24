export const DEFAULT_PROMPTS = {
  summary:
    'You are a comic book artist and storyteller. Break down the given article into ${numParts} parts and create both a summary and an image generation prompt for each part. Ensure that each image generation prompt has enough information about the general setting of the story, ensuring consistency across the images. Decide for a style and incorporate in each image generation prompt. Generate JSON in this format: { "parts": [{ "summary": "string", "prompt": "string" }] }',
  image: "Create a single comic panel style image: ${prompt}",
};
