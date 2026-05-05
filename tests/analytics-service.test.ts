/**
 * Tests for Session Analytics Service
 */
import { describe, test, expect, beforeEach } from "bun:test";
import { SessionAnalyticsService } from "../src/features/analytics/service";
import { Logger } from "../src/core/logger";

describe("SessionAnalyticsService", () => {
  let service: SessionAnalyticsService;
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = {
      info: () => {},
      warn: () => {},
      error: () => {},
    };
    service = new SessionAnalyticsService(mockLogger as any, "test-session");
  });

  test("should initialize with zero stats", () => {
    const stats = service.getStats();
    expect(stats.totalTurns).toBe(0);
    expect(stats.totalToolCalls).toBe(0);
    expect(stats.errorsEncountered).toBe(0);
  });

  test("should record turn start and end", () => {
    service.recordTurnStart(1);
    service.recordTurnEnd(1, { usage: { total_tokens: 1000 } });

    const stats = service.getStats();
    expect(stats.totalTurns).toBe(1);
    expect(stats.totalTokensUsed).toBe(1000);
    expect(stats.averageTokensPerTurn).toBe(1000);
  });

  test("should record tool calls", () => {
    service.recordToolCall("bash", true);
    service.recordToolCall("read", true);
    service.recordToolCall("bash", false, "Permission denied");

    const stats = service.getStats();
    expect(stats.totalToolCalls).toBe(3);
    expect(stats.errorsEncountered).toBe(1);
    expect(stats.toolCallsByType["bash"]).toBe(2);
    expect(stats.toolCallsByType["read"]).toBe(1);
  });

  test("should record FFI detections", () => {
    service.recordFFIDetection();
    service.recordFFIDetection();

    const stats = service.getStats();
    expect(stats.ffiDetections).toBe(2);
  });

  test("should record model switches", () => {
    service.recordModelSwitch();
    service.recordModelSwitch();

    const stats = service.getStats();
    expect(stats.modelSwitches).toBe(2);
  });

  test("should record compactions", () => {
    service.recordCompaction();
    service.recordCompaction();

    const stats = service.getStats();
    expect(stats.compactCount).toBe(2);
  });

  test("should generate report", () => {
    service.recordTurnStart(1);
    service.recordTurnEnd(1, { usage: { total_tokens: 500 } });
    service.recordToolCall("bash", true);

    const report = service.generateReport();
    expect(report).toContain("Session Analytics Report");
    expect(report).toContain("Total Turns");
    expect(report).toContain("Tool Usage");
    expect(report).toContain("bash");
  });

  test("should get tool call history", () => {
    service.recordToolCall("bash", true);
    service.recordToolCall("read", false, "File not found");

    const history = service.getToolCallHistory();
    expect(history.length).toBe(2);
    expect(history[0].toolName).toBe("bash");
    expect(history[1].success).toBe(false);
    expect(history[1].error).toBe("File not found");
  });

  test("should reset stats", () => {
    service.recordToolCall("bash", true);
    service.reset();

    const stats = service.getStats();
    expect(stats.totalToolCalls).toBe(0);
    expect(stats.totalTurns).toBe(0);
  });
});
