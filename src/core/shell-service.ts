/**
 * The ShellService provides a high-level wrapper around the raw `api.exec` 
 * for running system commands with consistent logging and error handling.
 */
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { Logger } from "./logger";

export interface ShellResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

export class ShellService {
  constructor(
    private readonly api: ExtensionAPI,
    private readonly logger: Logger
  ) {}

  /**
   * Executes a shell command.
   * @param cmd The command to run.
   * @param args Arguments for the command.
   * @param silent If true, prevents logging the command to the logger.
   */
  async exec(cmd: string, args: string[] = [], silent = false): Promise<ShellResult> {
    if (!silent) {
      this.logger.info(`Executing shell: ${cmd} ${args.join(" ")}`);
    }

    try {
      // Use pi's raw exec
      const result = await this.api.exec(cmd, args);
      
      // Note: Depending on the exact return type of api.exec in the SDK, 
      // we might need to normalize it here. Assuming it returns a standard result.
      const success = result.exitCode === 0;
      
      if (!success && !silent) {
        this.logger.warn(`Command failed with code ${result.exitCode}: ${result.stderr}`, undefined);
      }

      return {
        stdout: result.stdout || "",
        stderr: result.stderr || "",
        exitCode: result.exitCode ?? 1,
        success
      };
    } catch (e: any) {
      this.logger.error(`Shell execution error: ${e.message}`, undefined);
      return {
        stdout: "",
        stderr: e.message,
        exitCode: 1,
        success: false
      };
    }
  }
}
