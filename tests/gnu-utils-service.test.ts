import { describe, expect, it, beforeEach, vi } from "bun:test";
import { GnuUtilsService } from "../src/core/gnu-utils-service";
import { ShellService } from "../src/core/shell-service";
import { SystemToolService } from "../src/core/system-tool-service";
import { Logger } from "../src/core/logger";
import { createMockApi } from "./mocks";

describe("Core Service: GnuUtilsService", () => {
  let api: ReturnType<typeof createMockApi>;
  let shellService: ShellService;
  let gnuUtilsService: GnuUtilsService;

  beforeEach(() => {
    api = createMockApi();
    const logger = new Logger();
    shellService = new ShellService(api as any, logger);

    // Mock SystemToolService to always return true for exists()
    const mockSystemToolService = {
      exists: vi.fn().mockResolvedValue(true),
      findPath: vi.fn().mockResolvedValue(null),
      ensure: vi.fn().mockResolvedValue(undefined),
    } as any;

    gnuUtilsService = new GnuUtilsService(shellService, mockSystemToolService);
  });

  describe("grep()", () => {
    it("should search for a pattern in a file", async () => {
      (api.exec as vi.SpiedFunction<any>).mockResolvedValue({
        stdout: "line 1: match\nline 2: match\n",
        stderr: "",
        exitCode: 0,
      });

      const result = await gnuUtilsService.grep("match", "file.txt");

      expect(result).toEqual(["line 1: match", "line 2: match"]);
    });

    it("should return empty array when grep finds no matches", async () => {
      (api.exec as vi.SpiedFunction<any>).mockResolvedValue({
        stdout: "",
        stderr: "",
        exitCode: 1,
      });

      const result = await gnuUtilsService.grep("notfound", "file.txt");

      expect(result).toEqual([]);
    });

    it("should use -r flag for recursive search", async () => {
      (api.exec as vi.SpiedFunction<any>).mockResolvedValue({
        stdout: "",
        stderr: "",
        exitCode: 0,
      });

      await gnuUtilsService.grep("pattern", ".", { recursive: true });

      expect(api.exec).toHaveBeenCalledWith("grep", ["-r", "pattern", "."]);
    });

    it("should use -i flag for case-insensitive search", async () => {
      (api.exec as vi.SpiedFunction<any>).mockResolvedValue({
        stdout: "",
        stderr: "",
        exitCode: 0,
      });

      await gnuUtilsService.grep("pattern", "file.txt", { ignoreCase: true });

      expect(api.exec).toHaveBeenCalledWith("grep", ["-i", "pattern", "file.txt"]);
    });

    it("should combine -r and -i flags", async () => {
      (api.exec as vi.SpiedFunction<any>).mockResolvedValue({
        stdout: "",
        stderr: "",
        exitCode: 0,
      });

      await gnuUtilsService.grep("pattern", ".", { recursive: true, ignoreCase: true });

      expect(api.exec).toHaveBeenCalledWith("grep", ["-r", "-i", "pattern", "."]);
    });

    it("should filter out empty lines from results", async () => {
      (api.exec as vi.SpiedFunction<any>).mockResolvedValue({
        stdout: "match\n\nmatch\n\n",
        stderr: "",
        exitCode: 0,
      });

      const result = await gnuUtilsService.grep("match", "file.txt");

      expect(result).toEqual(["match", "match"]);
    });
  });

  describe("find()", () => {
    it("should find files matching a pattern", async () => {
      (api.exec as vi.SpiedFunction<any>).mockResolvedValue({
        stdout: "./src/index.ts\n./tests/index.test.ts\n",
        stderr: "",
        exitCode: 0,
      });

      const result = await gnuUtilsService.find(".", "*.ts");

      expect(result).toEqual(["./src/index.ts", "./tests/index.test.ts"]);
    });

    it("should return empty array when no files match", async () => {
      (api.exec as vi.SpiedFunction<any>).mockResolvedValue({
        stdout: "",
        stderr: "",
        exitCode: 1,
      });

      const result = await gnuUtilsService.find(".", "nonexistent.xyz");

      expect(result).toEqual([]);
    });

    it("should filter out empty lines from results", async () => {
      (api.exec as vi.SpiedFunction<any>).mockResolvedValue({
        stdout: "file1.ts\n\nfile2.ts\n\n",
        stderr: "",
        exitCode: 0,
      });

      const result = await gnuUtilsService.find(".", "*.ts");

      expect(result).toEqual(["file1.ts", "file2.ts"]);
    });
  });

  describe("replaceInFile()", () => {
    it("should replace text in a file using sed", async () => {
      (api.exec as vi.SpiedFunction<any>).mockResolvedValue({
        stdout: "",
        stderr: "",
        exitCode: 0,
      });

      const result = await gnuUtilsService.replaceInFile("file.txt", "old", "new");

      expect(api.exec).toHaveBeenCalledWith("sed", ["-i", "olds/new", "file.txt"]);
      expect(result).toBe(true);
    });

    it("should return false when sed fails", async () => {
      (api.exec as vi.SpiedFunction<any>).mockResolvedValue({
        stdout: "",
        stderr: "sed: no input file",
        exitCode: 1,
      });

      const result = await gnuUtilsService.replaceInFile("missing.txt", "a", "b");

      expect(result).toBe(false);
    });
  });

  describe("count()", () => {
    it("should count lines by default", async () => {
      (api.exec as vi.SpiedFunction<any>).mockResolvedValue({
        stdout: "42 file.txt",
        stderr: "",
        exitCode: 0,
      });

      const result = await gnuUtilsService.count("file.txt");

      expect(api.exec).toHaveBeenCalledWith("wc", ["-l", "file.txt"]);
      expect(result).toBe(42);
    });

    it("should count words", async () => {
      (api.exec as vi.SpiedFunction<any>).mockResolvedValue({
        stdout: "150 file.txt",
        stderr: "",
        exitCode: 0,
      });

      const result = await gnuUtilsService.count("file.txt", "words");

      expect(api.exec).toHaveBeenCalledWith("wc", ["-w", "file.txt"]);
      expect(result).toBe(150);
    });

    it("should count bytes", async () => {
      (api.exec as vi.SpiedFunction<any>).mockResolvedValue({
        stdout: "1024 file.txt",
        stderr: "",
        exitCode: 0,
      });

      const result = await gnuUtilsService.count("file.txt", "bytes");

      expect(api.exec).toHaveBeenCalledWith("wc", ["-c", "file.txt"]);
      expect(result).toBe(1024);
    });

    it("should return 0 when wc fails", async () => {
      (api.exec as vi.SpiedFunction<any>).mockResolvedValue({
        stdout: "",
        stderr: "file not found",
        exitCode: 1,
      });

      const result = await gnuUtilsService.count("missing.txt");

      expect(result).toBe(0);
    });

    it("should parse only the number from wc output", async () => {
      (api.exec as vi.SpiedFunction<any>).mockResolvedValue({
        stdout: "100  file.txt",
        stderr: "",
        exitCode: 0,
      });

      const result = await gnuUtilsService.count("file.txt");

      expect(result).toBe(100);
    });

    it("should handle multi-digit numbers", async () => {
      (api.exec as vi.SpiedFunction<any>).mockResolvedValue({
        stdout: "12345 file.txt",
        stderr: "",
        exitCode: 0,
      });

      const result = await gnuUtilsService.count("file.txt");

      expect(result).toBe(12345);
    });
  });
});