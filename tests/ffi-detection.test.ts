/**
 * Tests for FFI Detection functionality
 */
import { describe, test, expect, beforeEach, mock } from "bun:test";
import { FFIDetectionService, FFI_PATTERNS } from "../src/core/ffi-detection-service";
import { WebDocService } from "../src/core/web-doc-service";

// Mock ShellService
class MockShellService {
  async exec(cmd: string): Promise<string> {
    return "";
  }
}

// Mock Logger
class MockLogger {
  info(msg: string, _ctx?: any) {}
  warn(msg: string, _ctx?: any) {}
  error(msg: string, _ctx?: any) {}
  debug(msg: string, _ctx?: any) {}
}

describe("FFI Detection Service", () => {
  let detectionService: FFIDetectionService;
  let mockShell: MockShellService;
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockShell = new MockShellService();
    mockLogger = new MockLogger();
    detectionService = new FFIDetectionService(mockShell as any, mockLogger as any);
  });

  test("should have FFI patterns defined", () => {
    expect(FFI_PATTERNS.length).toBeGreaterThan(0);

    const pythonCtypes = FFI_PATTERNS.find(p => p.ffiType === "ctypes");
    expect(pythonCtypes).toBeDefined();
    expect(pythonCtypes?.language).toBe("Python");
    expect(pythonCtypes?.indicators).toContain("import ctypes");
  });

  test("should detect no FFI in empty result", async () => {
    mockShell.exec = mock().mockResolvedValue("");

    const result = await detectionService.detectFFI("/test/path");

    expect(result.detected).toBe(false);
    expect(result.ffiInstances.length).toBe(0);
    expect(result.summary).toContain("No FFI patterns detected");
  });

  test("should generate recommendations when FFI detected", () => {
    const mockResult = {
      detected: true,
      projectRoot: "/test",
      ffiInstances: [{
        filePath: "/test/main.py",
        pattern: {
          language: "Python",
          ffiType: "ctypes",
          description: "Python ctypes",
          indicators: [],
          documentationUrls: []
        },
        confidence: "high" as const
      }],
      summary: "",
      recommendations: []
    };

    // Access private method via any cast for testing
    const service = new FFIDetectionService(mockShell as any, mockLogger as any);
    const recommendations = (service as any).generateRecommendations(mockResult);

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations.some((r: string) => r.includes("Python FFI"))).toBe(true);
  });

  test("should generate correct summary", () => {
    const mockResult = {
      detected: true,
      projectRoot: "/test",
      ffiInstances: [
        {
          filePath: "/test/a.py",
          pattern: { language: "Python", ffiType: "ctypes", description: "", indicators: [], documentationUrls: [] },
          confidence: "high" as const
        },
        {
          filePath: "/test/b.js",
          pattern: { language: "Node.js", ffiType: "N-API", description: "", indicators: [], documentationUrls: [] },
          confidence: "high" as const
        }
      ],
      summary: "",
      recommendations: []
    };

    const service = new FFIDetectionService(mockShell as any, mockLogger as any);
    const summary = (service as any).generateSummary(mockResult);

    expect(summary).toContain("2");
    expect(summary).toContain("Python/ctypes");
    expect(summary).toContain("Node.js/N-API");
  });
});

describe("WebDocService", () => {
  test("should extract text from HTML", () => {
    const mockApi = {
      getSignal: () => undefined
    };
    const service = new WebDocService(mockApi as any, new MockLogger() as any);

    const html = "<html><head><title>Test</title></head><body><script>skip</script><p>Hello World</p></body></html>";
    const text = (service as any).extractTextFromHTML(html);

    expect(text).toContain("Hello World");
    expect(text).not.toContain("skip");
  });

  test("should extract title from HTML", () => {
    const mockApi = {
      getSignal: () => undefined
    };
    const service = new WebDocService(mockApi as any, new MockLogger() as any);

    const html = "<html><head><title>FFI Documentation</title></head><body>Content</body></html>";
    const title = (service as any).extractTitle(html);

    expect(title).toBe("FFI Documentation");
  });
});

describe("FFI Pattern Matching", () => {
  test("should match Python ctypes indicators", () => {
    const pattern = FFI_PATTERNS.find(p => p.ffiType === "ctypes");
    expect(pattern).toBeDefined();
    expect(pattern?.indicators.some(i => i.includes("ctypes"))).toBe(true);
  });

  test("should match Node.js N-API indicators", () => {
    const pattern = FFI_PATTERNS.find(p => p.ffiType === "N-API");
    expect(pattern).toBeDefined();
    expect(pattern?.language).toBe("Node.js");
    expect(pattern?.indicators.some(i => i.includes("napi_"))).toBe(true);
  });

  test("should match Rust extern C indicators", () => {
    const pattern = FFI_PATTERNS.find(p => p.ffiType === "extern-c");
    expect(pattern).toBeDefined();
    expect(pattern?.language).toBe("Rust");
    expect(pattern?.indicators).toContain("extern \"C\"");
  });

  test("should have documentation URLs for all patterns", () => {
    for (const pattern of FFI_PATTERNS) {
      expect(pattern.documentationUrls.length).toBeGreaterThan(0);
      expect(pattern.documentationUrls[0]).toMatch(/^https?:\/\//);
    }
  });
});
