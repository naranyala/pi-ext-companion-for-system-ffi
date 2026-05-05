/**
 * Git Service - Provide git-related operations for the extension
 */
import { ShellService } from "./shell-service";
import { Logger } from "./logger";

export interface GitCommit {
  hash: string;
  author: string;
  date: string;
  message: string;
}

export class GitService {
  constructor(
    private readonly shell: ShellService,
    private readonly logger: Logger
  ) {}

  async isGitRepo(): Promise<boolean> {
    try {
      await this.shell.exec("git", ["rev-parse", "--is-inside-work-tree"]);
      return true;
    } catch {
      return false;
    }
  }

  async getStatus(filter?: string): Promise<string> {
    const args = ["status", "--short"];
    if (filter) {
      // Simple filtering for FFI related files
      const status = await this.shell.exec("git", args);
      return status.split("\n").filter(line => line.includes(filter)).join("\n");
    }
    return this.shell.exec("git", args);
  }

  async getLog(filter?: string, limit = 10): Promise<string> {
    const args = ["log", `--pretty=format:%h | %an | %ad | %s`, `-${limit}`];
    if (filter) {
      args.push("--", filter);
    }
    return this.shell.exec("git", args);
  }

  async getDiff(file: string): Promise<string> {
    return this.shell.exec("git", ["diff", "HEAD", file]);
  }

  async getBlame(file: string, line: number): Promise<string> {
    return this.shell.exec("git", ["blame", "-L", `${line},${line}`, file]);
  }
}
