/**
 * =================================================================================
 * MAIN EXTENSION ENTRY POINT (COMPOSER)
 * =================================================================================
 *
 * This file's sole responsibility is to initialize and wire together all the
 * services and features of the extension. This is known as the "composition root".
 *
 * Also exports Pi-Mono Primitives for other extensions to use.
 */
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { ServiceContainer } from "./core/services";

// FFI Detector imports
import { FFIDetectorTools } from "./features/ffi-detector/tools";
import { FFIDetectorCommands } from "./features/ffi-detector/commands";
import { FFIDetectorEvents } from "./features/ffi-detector/events";
import { QuickFfiActions } from "./features/ffi-detector/quick-actions";
import { FFIGitTools } from "./features/ffi-detector/git-tools";

// Analytics imports
import { AnalyticsTools } from "./features/analytics/tools";
import { SmartModelSelector } from "./features/analytics/model-selector";

// Quality imports
import { QualityTools } from "./features/quality/quality-tools";

// Export Pi-Mono Primitives for other extensions
export { createPiMonoClients as createPiMonoClients } from "./core/pi-mono-primitives";
export type { PiMonoClients } from "./core/pi-mono-primitives";

export default function (api: ExtensionAPI) {
  // 1. Initialize Service Container (The DI Root)
  const services = new ServiceContainer(api);

  // 2. Initialize FFI Detector Features
  try {
    new FFIDetectorTools(services).register();
    new FFIDetectorCommands(services).register();
    new FFIDetectorEvents(services).register();
    new QuickFfiActions(services).register();
    new FFIGitTools(services).register();
  } catch (e: any) {
    services.logger.error(`Failed to load FFI Detector: ${e.message}`, api);
  }

  // 4. Initialize Analytics Features
  try {
    new AnalyticsTools(services).register();
    new SmartModelSelector(services).register();
  } catch (e: any) {
    services.logger.error(`Failed to load Analytics: ${e.message}`, api);
  }

  // 5. Initialize Quality Tools
  try {
    new QualityTools(services).register();
  } catch (e: any) {
    services.logger.error(`Failed to load Quality Tools: ${e.message}`, api);
  }

  // 6. Register Global Lifecycle Hooks
  api.on("session_start", async (_event, ctx) => {
    try {
      // Initialize services that need async setup
      await services.init();

      await services.store.load();
      const sessionCount = services.store.get().sessionCount + 1;
      await services.store.update({ sessionCount });

    } catch (e: any) {
      services.logger.error(`Initialization failed: ${e.message}`, ctx);
    }
  });

  // Optional: Handle session end if event exists
  try {
    api.on("session_end", async () => {
      await services.dispose();
    });
  } catch {
    // session_end event may not exist in all versions
  }

  services.logger.info("FFI Companion Extension Initialized.");
}
