/**
 * File Search Service - Abstraction for searching files with different backends.
 */
import type { ShellResult } from "./shell-service";
import { ShellService } from "./shell-service";
import { Logger } from "./logger";

export interface FileSearchResult {
  file: string;
  line?: number;
  snippet?: string;
  confidence: "high" | "medium" | "low";
}

export interface FileSearchBackend {
  search(projectRoot: string, pattern: string, fileTypes: string[]): Promise<FileSearchResult[]>;
}

export class GrepBackend implements FileSearchBackend {
  constructor(private readonly shell: ShellService, private readonly logger: Logger) {}

  async search(projectRoot: string, pattern: string, fileTypes: string[]): Promise<FileSearchResult[]> {
    const results: FileSearchResult[] = [];
    const filePattern = fileTypes.map(ft => `--include="${ft}"`).join(" ");
    const escapedPattern = pattern.replace(/"/g, '\\"').replace(/'/g, "\\'");
    const cmd = `grep -r ${filePattern} -n -l "${escapedPattern}" "${projectRoot}" 2>/dev/null || true`;

    try {
      const output = await this.shell.exec("bash", ["-c", cmd], true);
      if (!output.success || !output.stdout.trim()) return results;

      const files = output.stdout.trim().split('\n').filter(f => f.trim());
      for (const file of files.slice(0, 10)) {
        const lineCmd = `grep -n "${escapedPattern}" "${file}" 2>/dev/null | head -5 || true`;
        const lineOutput = await this.shell.exec("bash", ["-c", lineCmd], true);

        if (lineOutput.stdout.trim()) {
          const lines = lineOutput.stdout.trim().split('\n');
          for (const line of lines.slice(0, 3)) {
            const match = line.match(/^(\d+):(.*)/);
            if (match) {
              results.push({
                file,
                line: parseInt(match[1]),
                snippet: match[2].trim().substring(0, 200),
                confidence: "high"
              });
            }
          }
        } else {
          results.push({ file, confidence: "medium" });
        }
      }
    } catch (e: any) {
      this.logger.warn(`Grep search failed for ${pattern}: ${e.message}`);
    }

    return results;
  }
}

export class RipgrepBackend implements FileSearchBackend {
  constructor(private readonly shell: ShellService, private readonly logger: Logger) {}

  async search(projectRoot: string, pattern: string, fileTypes: string[]): Promise<FileSearchResult[]> {
    const results: FileSearchResult[] = [];
    const typeArgs = fileTypes.map(ft => `-g "${ft}"`).join(" ");
    const cmd = `rg ${typeArgs} -n "${pattern}" "${projectRoot}" 2>/dev/null || true`;

    try {
      const output = await this.shell.exec("bash", ["-c", cmd], true);
      if (!output.success || !output.stdout.trim()) return results;

      const lines = output.stdout.trim().split('\n').filter(l => l.trim()).slice(0, 30);
      for (const line of lines) {
        // rg output: file:line:content
        const match = line.match(/^(.+?):(\d+):(.*)$/);
        if (match) {
          results.push({
            file: match[1],
            line: parseInt(match[2]),
            snippet: match[3].trim().substring(0, 200),
            confidence: "high"
          });
        }
      }
    } catch (e: any) {
      this.logger.warn(`Ripgrep search failed for ${pattern}: ${e.message}`);
    }

    return results;
  }
}

export class FileSearchService {
  constructor(
    private readonly backend: FileSearchBackend,
    private readonly logger: Logger
  ) {}

  async search(projectRoot: string, pattern: string, fileTypes: string[] = []): Promise<FileSearchResult[]> {
    return this.backend.search(projectRoot, pattern, fileTypes);
  }

  static createDefault(shell: ShellService, logger: Logger): FileSearchService {
    // Try ripgrep first, fallback to grep
    // For simplicity, use GrepBackend as default
    return new FileSearchService(new GrepBackend(shell, logger), logger);
  }
}
