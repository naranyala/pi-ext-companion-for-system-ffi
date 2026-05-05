/**
 * Tests for FFI Detector Commands
 */
import { describe, test, expect, beforeEach, mock } from "bun:test";
import { FFIDetectorCommands } from "../src/features/ffi-detector/commands";
import { FFIDetectorEvents } from "../src/features/ffi-detector/events";
import { createMockApi, createMockContext } from "../tests/mocks";
import { ServiceContainer } from "../src/core/services";
import { Logger } from "../src/core/logger";
import { ShellService } from "../src/core/shell-service";
import { FFIDetectionService } from "../src/core/ffi-detection-service";
import { WebDocService } from "../src/core/web-doc-service";

describe("FFI Detector Commands", () => {
  let api: ReturnType<typeof createMockApi>;
  let services: ServiceContainer;
  let mockLogger: any;

  beforeEach(() => {
    api = createMockApi();
    // Create minimal services
    const logger = new Logger();
    mockLogger = {
      info: mock(() => {}),
      warn: mock(() => {}),
      error: mock(() => {})
    };
    // We need to create a ServiceContainer, but it's complex. Instead, mock the services object.
    // For simplicity, test that commands register correctly.
  });

  test("should register ffi-detect command", () => {
    const services = {
      api,
      logger: mockLogger,
      shell: { exec: mock(() => Promise.resolve({ stdout: "", stderr: "", exitCode: 0, success: true })) },
      ffiDetection: { detectFFI: mock(() => Promise.resolve({ detected: false, ffiInstances: [], summary: "", recommendations: [], projectRoot: "" })) }
    } as any;

    new FFIDetectorCommands(services).register();

    expect(api.registerCommand).toHaveBeenCalledWith("ffi-detect", expect.any(Object));
  });

  test("should register ffi-resolve command", () => {
    const services = {
      api,
      logger: mockLogger,
      ffiDetection: {},
      webDoc: {}
    } as any;

    new FFIDetectorCommands(services).register();

    expect(api.registerCommand).toHaveBeenCalledWith("ffi-resolve", expect.any(Object));
  });

  test("should register ffi-docs command", () => {
    const services = {
      api,
      logger: mockLogger,
      webDoc: {}
    } as any;

    new FFIDetectorCommands(services).register();

    expect(api.registerCommand).toHaveBeenCalledWith("ffi-docs", expect.any(Object));
  });

  test("should register keyboard shortcut", () => {
    const services = {
      api,
      logger: mockLogger
    } as any;

    new FFIDetectorCommands(services).register();

    expect(api.registerShortcut).toHaveBeenCalledWith("ctrl+alt+f", expect.any(Object));
  });
});

describe("FFI Detector Events", () => {
  let api: ReturnType<typeof createMockApi>;
  let services: any;

  beforeEach(() => {
    api = createMockApi();
    services = {
      api,
      logger: {
        info: mock(() => {}),
        warn: mock(() => {}),
        error: mock(() => {})
      },
      ffiDetection: {
        detectFFI: mock(() => Promise.resolve({ detected: false, ffiInstances: [], summary: "", recommendations: [], projectRoot: "" }))
      }
    };
  });

  test("should register session_start event", () => {
    new FFIDetectorEvents(services).register();
    expect(api.on).toHaveBeenCalledWith("session_start", expect.any(Function));
  });

  test("should register tool_call event", () => {
    new FFIDetectorEvents(services).register();
    expect(api.on).toHaveBeenCalledWith("tool_call", expect.any(Function));
  });

  test("should register tool_result event", () => {
    new FFIDetectorEvents(services).register();
    expect(api.on).toHaveBeenCalledWith("tool_result", expect.any(Function));
  });

  test("should detect FFI-related files in tool_call", () => {
    const events = api.__unstable_getRegistry().events;
    new FFIDetectorEvents(services).register();

    const toolCallHandler = events.get("tool_call")?.[0];
    expect(toolCallHandler).toBeDefined();

    // Simulate a tool_call event for a .py file
    const ctx = createMockContext();
    toolCallHandler({ name: "write", params: { filePath: "test.py" } }, ctx);

    expect(services.logger.info).toHaveBeenCalledWith(
      expect.stringContaining("FFI-related file modified"),
      ctx
    );
  });
});
