/**
 * Tests for Quick FFI Actions
 */
import { describe, test, expect, beforeEach, mock } from "bun:test";
import { QuickFfiActions } from "../src/features/ffi-detector/quick-actions";
import { ServiceContainer } from "../src/core/services";

describe("QuickFfiActions", () => {
  let mockServices: any;
  let quickActions: QuickFfiActions;

  beforeEach(() => {
    mockServices = {
      api: {
        registerTool: mock(() => {}),
      },
      logger: {
        info: mock(() => {}),
        warn: mock(() => {}),
        error: mock(() => {}),
      },
      shell: {
        exec: mock(() => Promise.resolve({ stdout: "", stderr: "", exitCode: 0, success: true })),
      },
      ffiDetection: {},
      webDoc: {
        fetchFFIDocumentation: mock(() => Promise.resolve([])),
      },
    };

    quickActions = new QuickFfiActions(mockServices);
  });

  test("should register ffi_check_health tool", () => {
    quickActions.register();

    expect(mockServices.api.registerTool).toHaveBeenCalledWith(
      expect.objectContaining({ name: "ffi_check_health" })
    );
  });

  test("should register ffi_fix_common_issues tool", () => {
    quickActions.register();

    expect(mockServices.api.registerTool).toHaveBeenCalledWith(
      expect.objectContaining({ name: "ffi_fix_common_issues" })
    );
  });

  test("should register ffi_generate_wrapper tool", () => {
    quickActions.register();

    expect(mockServices.api.registerTool).toHaveBeenCalledWith(
      expect.objectContaining({ name: "ffi_generate_wrapper" })
    );
  });

  test("should register ffi_compare_backends tool", () => {
    quickActions.register();

    expect(mockServices.api.registerTool).toHaveBeenCalledWith(
      expect.objectContaining({ name: "ffi_compare_backends" })
    );
  });
});

describe("SmartModelSelector", () => {
  let mockServices: any;
  let selector: any;

  beforeEach(() => {
    mockServices = {
      api: {
        registerTool: mock(() => {}),
        getModel: mock(() => ({ id: "gpt-4" })),
      },
      logger: {
        info: mock(() => {}),
        warn: mock(() => {}),
        error: mock(() => {}),
      },
    };

    const { SmartModelSelector } = require("../src/features/analytics/model-selector");
    selector = new SmartModelSelector(mockServices);
  });

  test("should register recommend_model tool", () => {
    selector.register();

    expect(mockServices.api.registerTool).toHaveBeenCalledWith(
      expect.objectContaining({ name: "recommend_model" })
    );
  });

  test("should register switch_model_if_needed tool", () => {
    selector.register();

    expect(mockServices.api.registerTool).toHaveBeenCalledWith(
      expect.objectContaining({ name: "switch_model_if_needed" })
    );
  });
});
