import { beforeEach, describe, expect, it, vi } from "bun:test";
import { Logger } from "../src/core/logger";
import { createMockContext } from "./mocks";

describe("Core Service: Logger", () => {
  let logger: Logger;
  let ctx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    logger = new Logger();
    ctx = createMockContext();
  });

  describe("info()", () => {
    it("should log to console.log with [INFO] prefix", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      logger.info("Test message");
      expect(consoleSpy).toHaveBeenCalledWith("[INFO] Test message");
      consoleSpy.mockRestore();
    });

    it("should call ctx.ui.notify when context is provided", () => {
      logger.info("Test message", ctx);
      expect(ctx.ui.notify).toHaveBeenCalledWith("Test message", "info");
    });

    it("should not call ctx.ui.notify when context is undefined", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      logger.info("Test message", undefined);
      expect(ctx.ui.notify).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("warn()", () => {
    it("should log to console.warn with [WARN] prefix", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      logger.warn("Warning message");
      expect(consoleSpy).toHaveBeenCalledWith("[WARN] Warning message");
      consoleSpy.mockRestore();
    });

    it("should call ctx.ui.notify with warning level when context is provided", () => {
      logger.warn("Warning message", ctx);
      expect(ctx.ui.notify).toHaveBeenCalledWith("Warning message", "warning");
    });
  });

  describe("error()", () => {
    it("should log to console.error with [ERROR] prefix", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      logger.error("Error message");
      expect(consoleSpy).toHaveBeenCalledWith("[ERROR] Error message");
      consoleSpy.mockRestore();
    });

    it("should call ctx.ui.notify with error level when context is provided", () => {
      logger.error("Error message", ctx);
      expect(ctx.ui.notify).toHaveBeenCalledWith("Error message", "error");
    });
  });

  it("should handle empty string messages", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.info("");
    expect(consoleSpy).toHaveBeenCalledWith("[INFO] ");
    consoleSpy.mockRestore();
  });

  it("should handle messages with special characters", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.info("Message with `backticks` and $variable");
    expect(consoleSpy).toHaveBeenCalledWith("[INFO] Message with `backticks` and $variable");
    consoleSpy.mockRestore();
  });
});