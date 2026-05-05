/**
 * Simplified Integration tests for FFI Detector
 */
import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test";
import { FFIDetectionService } from "../src/core/ffi-detection-service";
import { WebDocService } from "../src/core/web-doc-service";
import { Logger } from "../src/core/logger";

const originalFetch = globalThis.fetch;
const mockFetch = mock(() => Promise.resolve({
  ok: true,
  status: 200,
  headers: new Map([["content-type", "text/html"]]),
  text: () => Promise.resolve("<html><head><title>ctypes Docs</title></head><body><p>ctypes is a Python module.</p></body></html>")
})) as any;

describe("FFI Detector Integration", () => {
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = {
      info: mock(() => {}),
      warn: mock(() => {}),
      error: mock(() => {})
    };
    globalThis.fetch = mockFetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("WebDocService should fetch docs", async () => {
    const api = { getSignal: () => new AbortController().signal } as any;
    const webDocService = new WebDocService(api, mockLogger);

    const results = await webDocService.fetchFFIDocumentation("ctypes", ["https://example.com"]);
    expect(results.length).toBe(1);
    expect(results[0].title).toBe("ctypes Docs");
  });

  test("FFIDetectionService constructor should accept FileSearchService", () => {
    const shell = { exec: mock(() => Promise.resolve({ stdout: "", stderr: "", exitCode: 0, success: true })) } as any;
    const detectionService = new FFIDetectionService(shell, mockLogger, undefined);
    expect(detectionService).toBeDefined();
  });
});
