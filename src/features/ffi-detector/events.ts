/**
 * FFI Detector Events - Event handlers for FFI detection feature
 */
import type { Services } from "../../core/services";

export class FFIDetectorEvents {
  constructor(private readonly services: Services) {}

  register() {
    const { api, logger } = this.services;

    api.on("tool_call", async (event, ctx) => {
      if (event.name === "write" || event.name === "edit") {
        const path = (event.params as any)?.filePath || (event.params as any)?.path;
        if (path && this.isFFIRelatedFile(path)) {
          logger.info(`FFI Detector: FFI-related file modified: ${path}. Consider running /ffi-detect to rescan.`, ctx);
        }
      }
    });

    api.on("tool_result", async (event, ctx) => {
      if (event.tool_name === "ffi_detect" && event.status === "success") {
        const result = (event as any).details;
        if (result?.detected) {
          ctx.ui?.notify?.(`FFI detected: ${result.summary}`, "info");
        }
      }
    });
  }

  private isFFIRelatedFile(filePath: string): boolean {
    const ffiPatterns = [
      /\.py$/, /\.js$/, /\.ts$/, /\.rs$/, /\.go$/,
      /\.java$/, /\.cs$/, /\.c$/, /\.cpp$/, /\.h$/,
      /binding\.gyp$/, /Cargo\.toml$/, /setup\.py$/
    ];

    return ffiPatterns.some(pattern => pattern.test(filePath));
  }
}
