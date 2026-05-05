/**
 * Web Documentation Service - Fetches FFI documentation using web capabilities
 */
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Logger } from "./logger";

export interface FFIDocResult {
  url: string;
  title: string;
  content: string;
  snippets: string[];
  error?: string;
}

export class WebDocService {
  constructor(
    private readonly api: ExtensionAPI,
    private readonly logger: Logger
  ) {}

  async fetchFFIDocumentation(ffiType: string, urls: string[]): Promise<FFIDocResult[]> {
    const results: FFIDocResult[] = [];

    for (const url of urls.slice(0, 3)) {
      try {
        this.logger.info(`Fetching FFI documentation from: ${url}`);

        const response = await fetch(url, { signal: this.api.getSignal?.() });

        if (!response.ok) {
          results.push({
            url,
            title: "",
            content: "",
            snippets: [],
            error: `HTTP ${response.status}: ${response.statusText}`
          });
          continue;
        }

        const contentType = response.headers.get("content-type") || "";
        let content = "";
        let title = "";

        if (contentType.includes("text/html")) {
          const html = await response.text();
          title = this.extractTitle(html);
          content = this.extractTextFromHTML(html);
        } else {
          content = await response.text();
          title = this.extractTitle(content);
        }

        const snippets = this.extractRelevantSnippets(content, ffiType);

        results.push({
          url,
          title: title || url,
          content: content.substring(0, 5000),
          snippets
        });

      } catch (e: any) {
        this.logger.warn(`Failed to fetch ${url}: ${e.message}`);
        results.push({
          url,
          title: "",
          content: "",
          snippets: [],
          error: e.message
        });
      }
    }

    return results;
  }

  async searchFFIResources(ffiType: string, language: string): Promise<string[]> {
    try {
      const query = `${language} ${ffiType} FFI documentation example tutorial`;
      const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

      const response = await fetch(searchUrl, {
        signal: this.api.getSignal?.(),
        headers: {
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
        }
      });

      if (!response.ok) return [];

      const html = await response.text();
      return this.extractSearchResults(html).slice(0, 5);

    } catch (e: any) {
      this.logger.warn(`Search failed for ${ffiType}: ${e.message}`);
      return [];
    }
  }

  private extractTextFromHTML(html: string): string {
    return html
      .replace(/<script[^>]*>.*?<\/script>/gs, "")
      .replace(/<style[^>]*>.*?<\/style>/gs, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private extractTitle(html: string): string {
    const match = html.match(/<title>(.*?)<\/title>/i);
    return match ? match[1].trim() : "";
  }

  private extractRelevantSnippets(content: string, ffiType: string): string[] {
    const snippets: string[] = [];
    const lines = content.split(/[.!?]\s+/);
    const keywords = [ffiType.toLowerCase(), "example", "usage", "function", "extern"];

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (keywords.some(k => lowerLine.includes(k)) && line.length > 30 && line.length < 300) {
        snippets.push(line.trim());
        if (snippets.length >= 5) break;
      }
    }

    return snippets;
  }

  private extractSearchResults(html: string): string[] {
    const urls: string[] = [];
    const regex = /<a[^>]+class="result__a"[^>]+href="([^"]+)"/g;
    let match;

    while ((match = regex.exec(html)) !== null && urls.length < 5) {
      try {
        const url = decodeURIComponent(match[1].replace(/^\/\/duckduckgo\.com\/l\/\?uddg=/, ""));
        if (url.startsWith("http")) urls.push(url);
      } catch {
        // Ignore decode errors
      }
    }

    return urls;
  }
}
