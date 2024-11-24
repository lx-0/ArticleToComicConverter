export const DEFAULT_PROMPTS = {
  summary: 'You are a comic book artist and storyteller. Break down the given article into ${numParts} parts and create both a summary and an image generation prompt for each part. Generate JSON in this format: { "parts": [{ "summary": "string", "prompt": "string" }] }',
  image: 'Create a comic panel style image: ${prompt}'
};
