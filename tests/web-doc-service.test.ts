/**
 * Tests for WebDocService
 */
import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test";
import { WebDocService } from "../src/core/web-doc-service";
import { createMockApi } from "./mocks";

// Mock fetch globally
const originalFetch = globalThis.fetch;

describe("WebDocService", () => {
  let api: ReturnType<typeof createMockApi>;
  let service: WebDocService;
  let mockLogger: any;

  beforeEach(() => {
    api = createMockApi();
    mockLogger = {
      info: mock(() => {}),
      warn: mock(() => {}),
      error: mock(() => {})
    };
    service = new WebDocService(api as any, mockLogger as any);
    globalThis.fetch = mock(() => Promise.resolve({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Map([["content-type", "text/html"]]),
      text: () => Promise.resolve("<html><head><title>Test Doc</title></head><body><p>Hello</p></body></html>"),
      json: () => Promise.resolve({})
    })) as any;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("should fetch documentation from URLs", async () => {
    const results = await service.fetchFFIDocumentation("ctypes", ["https://docs.python.org/3/library/ctypes.html"]);

    expect(results.length).toBe(1);
    expect(results[0].url).toBe("https://docs.python.org/3/library/ctypes.html");
    expect(results[0].error).toBeUndefined();
  });

  test("should handle fetch errors", async () => {
    globalThis.fetch = mock(() => Promise.reject(new Error("Network error"))) as any;

    const results = await service.fetchFFIDocumentation("ctypes", ["https://example.com"]);

    expect(results[0].error).toContain("Network error");
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  test("should extract text from HTML", async () => {
    globalThis.fetch = mock(() => Promise.resolve({
      ok: true,
      headers: new Map([["content-type", "text/html"]]),
      text: () => Promise.resolve("<html><head><title>Test</title></head><body><script>skip</script><p>Content here</p></body></html>")
    })) as any;

    const results = await service.fetchFFIDocumentation("test", ["https://example.com"]);

    expect(results[0].content).toContain("Content here");
    expect(results[0].content).not.toContain("skip");
  });

  test("should extract title from HTML", async () => {
    globalThis.fetch = mock(() => Promise.resolve({
      ok: true,
      headers: new Map([["content-type", "text/html"]]),
      text: () => Promise.resolve("<html><head><title>FFI Docs</title></head><body></body></html>")
    })) as any;

    const results = await service.fetchFFIDocumentation("test", ["https://example.com"]);

    expect(results[0].title).toBe("FFI Docs");
  });

  test("should extract relevant snippets", async () => {
    const content = "This is an example of ctypes usage. Here is another example. Not relevant. Use ctypes to call C functions.";
    globalThis.fetch = mock(() => Promise.resolve({
      ok: true,
      headers: new Map([["content-type", "text/plain"]]),
      text: () => Promise.resolve(content)
    })) as any;

    const results = await service.fetchFFIDocumentation("ctypes", ["https://example.com"]);

    expect(results[0].snippets.length).toBeGreaterThan(0);
    expect(results[0].snippets.some(s => s.includes("example"))).toBe(true);
  });

  test("should search FFI resources via web search", async () => {
    globalThis.fetch = mock(() => Promise.resolve({
      ok: true,
      headers: new Map([["content-type", "text/html"]]),
      text: () => Promise.resolve(`
        <html>
          <a class="result__a" href="https://docs.python.org/ctypes">ctypes docs</a>
          <a class="result__a" href="https://cffi.readthedocs.io">cffi docs</a>
        </html>
      `)
    })) as any;

    // Access private method for testing
    const searchResults = await (service as any).searchFFIResources("ctypes", "Python");

    expect(searchResults.length).toBeGreaterThan(0);
    expect(searchResults[0]).toContain("https://");
  });
});
