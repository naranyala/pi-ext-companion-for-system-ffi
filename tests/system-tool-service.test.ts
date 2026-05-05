import { describe, expect, it, beforeEach, vi } from "bun:test";
import { SystemToolService } from "../src/core/system-tool-service";
import { ShellService } from "../src/core/shell-service";
import { Logger } from "../src/core/logger";
import { createMockApi } from "./mocks";

describe("Core Service: SystemToolService", () => {
  let api: ReturnType<typeof createMockApi>;
  let shellService: ShellService;
  let systemToolService: SystemToolService;

  beforeEach(() => {
    api = createMockApi();
    const logger = new Logger();
    shellService = new ShellService(api as any, logger);
    systemToolService = new SystemToolService(shellService);
  });

  describe("exists()", () => {
    it("should return true when tool is found in PATH", async () => {
      const mockExec = api.exec as vi.SpiedFunction<any>;
      mockExec.mockClear?.();
      mockExec.mockResolvedValue({
        stdout: "/usr/bin/node",
        stderr: "",
        exitCode: 0,
      });

      const result = await systemToolService.exists("node");

      expect(result).toBe(true);
      expect(mockExec).toHaveBeenCalled();
    });

    it("should return false when tool is not found in PATH", async () => {
      (api.exec as vi.SpiedFunction<any>).mockResolvedValue({
        stdout: "",
        stderr: "command not found",
        exitCode: 1,
      });

      const result = await systemToolService.exists("nonexistent-tool");

      expect(result).toBe(false);
    });
  });

  describe("findPath()", () => {
    it("should return the path when tool is found", async () => {
      (api.exec as vi.SpiedFunction<any>).mockResolvedValue({
        stdout: "/usr/local/bin/git  \n",
        stderr: "",
        exitCode: 0,
      });

      const result = await systemToolService.findPath("git");

      expect(result).toBe("/usr/local/bin/git");
    });

    it("should return null when tool is not found", async () => {
      (api.exec as vi.SpiedFunction<any>).mockResolvedValue({
        stdout: "",
        stderr: "",
        exitCode: 1,
      });

      const result = await systemToolService.findPath("missing");

      expect(result).toBeNull();
    });

    it("should trim whitespace from the path", async () => {
      (api.exec as vi.SpiedFunction<any>).mockResolvedValue({
        stdout: "  /bin/ls  \n",
        stderr: "",
        exitCode: 0,
      });

      const result = await systemToolService.findPath("ls");

      expect(result).toBe("/bin/ls");
    });
  });

  describe("ensure()", () => {
    it("should not throw when tool exists", async () => {
      (api.exec as vi.SpiedFunction<any>).mockResolvedValue({
        stdout: "/usr/bin/python",
        stderr: "",
        exitCode: 0,
      });

      await expect(systemToolService.ensure("python")).resolves.toBeUndefined();
    });

    it("should throw with default message when tool is missing", async () => {
      (api.exec as vi.SpiedFunction<any>).mockResolvedValue({
        stdout: "",
        stderr: "",
        exitCode: 1,
      });

      await expect(systemToolService.ensure("missing-tool")).rejects.toThrow(
        "Required system tool 'missing-tool' was not found in the system PATH. Please install it to use this feature."
      );
    });

    it("should throw with custom error message when provided", async () => {
      (api.exec as vi.SpiedFunction<any>).mockResolvedValue({
        stdout: "",
        stderr: "",
        exitCode: 1,
      });

      await expect(
        systemToolService.ensure("gcc", "C++ compiler is required for building this project.")
      ).rejects.toThrow("C++ compiler is required for building this project.");
    });

    it("should include tool name in custom error message", async () => {
      (api.exec as vi.SpiedFunction<any>).mockResolvedValue({
        stdout: "",
        stderr: "",
        exitCode: 1,
      });

      await expect(
        systemToolService.ensure("rustc", "rustc not found!")
      ).rejects.toThrow("rustc not found!");
    });
  });
});