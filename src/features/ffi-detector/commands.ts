/**
 * FFI Detector Commands - Interactive commands for FFI detection
 */
import type { Services } from "../../core/services";

export class FFIDetectorCommands {
  constructor(private readonly services: Services) {}

  register() {
    const { api, logger } = this.services;

    api.registerCommand("ffi-detect", {
      description: "Detect FFI patterns in the current project",
      handler: async (args, ctx) => {
        const projectPath = args || process.cwd();

        logger.info(`🔍 Scanning for FFI patterns in: ${projectPath}`, ctx);

        const { FFIDetectionService } = await import("../../core/ffi-detection-service");
        const { FFIDetectorTools } = await import("./tools");
        const detectionService = new FFIDetectionService(
          this.services.shell,
          logger
        );

        const result = await detectionService.detectFFI(projectPath);

        const tools = new FFIDetectorTools(this.services);
        const formatted = tools["formatDetectionResult"](result);

        logger.info(formatted, ctx);

        if (result.detected) {
          ctx.ui?.notify?.(`Found ${result.ffiInstances.length} FFI instance(s)`, "info");
        } else {
          ctx.ui?.notify?.("No FFI patterns detected", "info");
        }
      }
    });

    api.registerCommand("ffi-resolve", {
      description: "Get help resolving FFI issues with LLM assistance",
      handler: async (args, ctx) => {
        const [ffiType, language, ...issueParts] = (args || "").split("|").map(s => s.trim());
        const issue = issueParts.join(" ").trim() || undefined;

        if (!ffiType || !language) {
          logger.info(`Usage: /ffi-resolve <ffi-type>|<language> [| issue description]`, ctx);
          logger.info(`Example: /ffi-resolve N-API|Node.js|build fails with node-gyp error`, ctx);
          return;
        }

        logger.info(`🔧 Resolving ${ffiType} (${language}) issues...`, ctx);

        const { FFIDetectorTools } = await import("./tools");
        const tools = new FFIDetectorTools(this.services);

        const result = await tools["generateResolution"](
          tools["findPattern"](ffiType, language) || {
            language,
            ffiType,
            description: "",
            indicators: [],
            documentationUrls: []
          },
          await new (await import("../../core/web-doc-service")).WebDocService(api, logger)
            .fetchFFIDocumentation(ffiType, []),
          await new (await import("../../core/web-doc-service")).WebDocService(api, logger)
            .searchFFIResources(ffiType, language),
          issue
        );

        logger.info(result, ctx);
      }
    });

    api.registerCommand("ffi-docs", {
      description: "Fetch FFI documentation for a specific type",
      handler: async (args, ctx) => {
        const [ffiType, language] = (args || "").split("|").map(s => s.trim());

        if (!ffiType || !language) {
          logger.info(`Usage: /ffi-docs <ffi-type>|<language>`, ctx);
          logger.info(`Example: /ffi-docs ctypes|Python`, ctx);
          return;
        }

        logger.info(`📚 Fetching docs for ${ffiType} (${language})...`, ctx);

        const { FFIDetectorTools } = await import("./tools");
        const tools = new FFIDetectorTools(this.services);

        const pattern = tools["findPattern"](ffiType, language);
        if (!pattern) {
          logger.warn(`Unknown FFI type: ${ffiType} for language: ${language}`, ctx);
          return;
        }

        const webDocService = new (await import("../../core/web-doc-service")).WebDocService(api, logger);
        const docs = await webDocService.fetchFFIDocumentation(ffiType, pattern.documentationUrls);

        for (const doc of docs) {
          if (doc.error) {
            logger.warn(`Failed to fetch ${doc.url}: ${doc.error}`, ctx);
          } else {
            logger.info(`## ${doc.title || doc.url}\n\n${doc.content.substring(0, 1500)}`, ctx);
            if (doc.snippets.length > 0) {
              logger.info(`**Snippets**:\n${doc.snippets.map(s => `- ${s}`).join('\n')}`, ctx);
            }
          }
        }
      }
    });

    api.registerShortcut?.("ctrl+alt+f", {
      description: "FFI Detector: Quick scan for FFI patterns",
      handler: async (ctx) => {
        logger.info("🔍 Quick FFI scan triggered...", ctx);
        const { FFIDetectionService } = await import("../../core/ffi-detection-service");
        const detectionService = new FFIDetectionService(this.services.shell, logger);
        const result = await detectionService.detectFFI(process.cwd());

        if (result.detected) {
          ctx.ui?.notify?.(`FFI detected: ${result.summary}`, "info");
        } else {
          ctx.ui?.notify?.("No FFI patterns found", "info");
        }
      }
    });
  }
}
