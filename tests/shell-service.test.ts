import { describe, expect, it, beforeEach, vi } from "bun:test";
import { ShellService, type ShellResult } from "../src/core/shell-service";
import { Logger } from "../src/core/logger";
import { createMockApi, createMockContext } from "./mocks";

describe("Core Service: ShellService", () => {
  let api: ReturnType<typeof createMockApi>;
  let logger: Logger;
  let shellService: ShellService;

  beforeEach(() => {
    api = createMockApi();
    logger = new Logger();
    shellService = new ShellService(api as any, logger);
  });

  describe("exec()", () => {
    it("should execute a command with api.exec", async () => {
      (api.exec as vi.SpiedFunction<any>).mockResolvedValue({
        stdout: "output",
        stderr: "",
        exitCode: 0,
      });

      const result = await shellService.exec("echo", ["hello"]);

      expect(api.exec).toHaveBeenCalledWith("echo", ["hello"]);
      expect(result.stdout).toBe("output");
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
    });

    it("should log the command when silent is false", async () => {
      (api.exec as vi.SpiedFunction<any>).mockResolvedValue({
        stdout: "",
        stderr: "",
        exitCode: 0,
      });

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      await shellService.exec("echo", ["hello"], false);

      expect(consoleSpy).toHaveBeenCalledWith("[INFO] Executing shell: echo hello");
      consoleSpy.mockRestore();
    });

    it("should not log the command when silent is true", async () => {
      (api.exec as vi.SpiedFunction<any>).mockResolvedValue({
        stdout: "",
        stderr: "",
        exitCode: 0,
      });

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      await shellService.exec("echo", ["hello"], true);

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should return success=false on non-zero exit code", async () => {
      (api.exec as vi.SpiedFunction<any>).mockResolvedValue({
        stdout: "",
        stderr: "Command failed",
        exitCode: 127,
      });

      const result = await shellService.exec("failing-command", []);

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(127);
      expect(result.stderr).toBe("Command failed");
    });

    it("should warn when command fails", async () => {
      (api.exec as vi.SpiedFunction<any>).mockResolvedValue({
        stdout: "",
        stderr: "Not found",
        exitCode: 127,
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      await shellService.exec("badcmd", [], false);

      expect(consoleSpy).toHaveBeenCalledWith("[WARN] Command failed with code 127: Not found");
      consoleSpy.mockRestore();
    });

    it("should handle errors from api.exec throwing", async () => {
      (api.exec as vi.SpiedFunction<any>).mockRejectedValue(new Error("Network error"));

      const result = await shellService.exec("curl", ["http://invalid"]);

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toBe("Network error");
    });

    it("should log error when execution throws", async () => {
      (api.exec as vi.SpiedFunction<any>).mockRejectedValue(new Error("Shell error"));

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      await shellService.exec("badcmd", [], false);

      expect(consoleSpy).toHaveBeenCalledWith("[ERROR] Shell execution error: Shell error");
      consoleSpy.mockRestore();
    });

    it("should handle empty stdout and stderr gracefully", async () => {
      (api.exec as vi.SpiedFunction<any>).mockResolvedValue({
        stdout: undefined,
        stderr: undefined,
        exitCode: 0,
      });

      const result = await shellService.exec("true");

      expect(result.stdout).toBe("");
      expect(result.stderr).toBe("");
    });

    it("should handle missing exitCode gracefully", async () => {
      (api.exec as vi.SpiedFunction<any>).mockResolvedValue({
        stdout: "output",
        stderr: "",
        exitCode: undefined,
      });

      const result = await shellService.exec("cmd");

      expect(result.exitCode).toBe(1); // defaults to 1
      expect(result.success).toBe(false);
    });

    it("should handle args with spaces and special characters", async () => {
      (api.exec as vi.SpiedFunction<any>).mockResolvedValue({
        stdout: "file.txt",
        stderr: "",
        exitCode: 0,
      });

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      await shellService.exec("find", [".", "-name", "file with spaces.txt"]);

      expect(consoleSpy).toHaveBeenCalledWith("[INFO] Executing shell: find . -name file with spaces.txt");
      consoleSpy.mockRestore();
    });
  });
});