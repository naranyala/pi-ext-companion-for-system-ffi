/**
 * The SystemToolService handles discovery and validation of system binaries.
 * It allows the extension to check if required tools are installed before attempting to use them.
 */
import type { ShellService } from "./shell-service";

export class SystemToolService {
  constructor(private readonly shell: ShellService) {}

  /**
   * Checks if a tool is available in the system PATH.
   */
  async exists(tool: string): Promise<boolean> {
    // 'command -v' is more portable than 'which' across different shells/OS
    const result = await this.shell.exec("command", ["-v", tool], true);
    return result.success;
  }

  /**
   * Returns the absolute path to a tool if it exists.
   */
  async findPath(tool: string): Promise<string | null> {
    const result = await this.shell.exec("command", ["-v", tool], true);
    return result.success ? result.stdout.trim() : null;
  }

  /**
   * Ensures a tool exists, otherwise throws a descriptive error.
   * Useful during extension initialization or before a critical operation.
   */
  async ensure(tool: string, customErrorMessage?: string): Promise<void> {
    const available = await this.exists(tool);
    if (!available) {
      throw new Error(
        customErrorMessage || 
        `Required system tool '${tool}' was not found in the system PATH. Please install it to use this feature.`
      );
    }
  }
}
