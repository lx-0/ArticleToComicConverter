import * as cheerio from "cheerio";

export async function scrapeArticle(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $("script").remove();
    $("style").remove();
    $("nav").remove();
    $("header").remove();
    $("footer").remove();
    $("aside").remove();

    // Extract main content
    const content = $("article, main, .content, .post-content")
      .first()
      .text()
      .trim();

    if (!content) {
      // Fallback to body content if no specific content container found
      return $("body")
        .text()
        .replace(/\s+/g, " ")
        .trim();
    }

    return content;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to scrape article: ${errorMessage}`);
  }
}
