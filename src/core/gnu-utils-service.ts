/**
 * The GnuUtilsService provides high-level, type-safe wrappers around common 
 * GNU utilities (grep, find, sed, etc.), ensuring they are available and 
 * using consistent flags.
 */
import type { ShellService } from "./shell-service";
import type { SystemToolService } from "./system-tool-service";

export class GnuUtilsService {
  constructor(
    private readonly shell: ShellService,
    private readonly systemTool: SystemToolService
  ) {}

  /**
   * Search for a pattern in a file or directory.
   */
  async grep(pattern: string, path: string, options: { recursive?: boolean; ignoreCase?: boolean } = {}): Promise<string[]> {
    await this.systemTool.ensure("grep");

    const args = [];
    if (options.recursive) args.push("-r");
    if (options.ignoreCase) args.push("-i");
    args.push(pattern, path);

    const result = await this.shell.exec("grep", args);
    if (!result.success) return [];

    return result.stdout.split("\n").filter(line => line.trim() !== "");
  }

  /**
   * Find files matching a specific name pattern.
   */
  async find(root: string, pattern: string): Promise<string[]> {
    await this.systemTool.ensure("find");

    const result = await this.shell.exec("find", [root, "-name", pattern]);
    if (!result.success) return [];

    return result.stdout.split("\n").filter(line => line.trim() !== "");
  }

  /**
   * Replace text in a file using sed (stream editor).
   * This is a simplified wrapper for basic substitution.
   */
  async replaceInFile(path: string, search: string, replace: string): Promise<boolean> {
    await this.systemTool.ensure("sed");

    // Use sed -i for in-place editing. Note: MacOS and Linux sed have slightly different -i syntax.
    // This implementation targets GNU sed.
    const sedExpr = `${search}s/${replace}`;
    const result = await this.shell.exec("sed", ["-i", sedExpr, path]);
    
    return result.success;
  }

  /**
   * Count lines, words, or characters in a file.
   */
  async count(path: string, mode: "lines" | "words" | "bytes" = "lines"): Promise<number> {
    await this.systemTool.ensure("wc");

    const flag = mode === "lines" ? "-l" : mode === "words" ? "-w" : "-c";
    const result = await this.shell.exec("wc", [flag, path]);
    
    if (!result.success) return 0;
    
    // wc output is usually "10 file.txt", we just want the number
    const match = result.stdout.trim().match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }
}
