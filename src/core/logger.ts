/**
 * A simple Logger service that wraps the global console and context-based notifications.
 */
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";

export class Logger {
    constructor() {}

    info(message: string, ctx?: ExtensionContext) {
        if (ctx) {
            ctx.ui.notify(message, "info");
        }
        console.log(`[INFO] ${message}`);
    }

    warn(message: string, ctx?: ExtensionContext) {
        if (ctx) {
            ctx.ui.notify(message, "warning");
        }
        console.warn(`[WARN] ${message}`);
    }

    error(message: string, ctx?: ExtensionContext) {
        if (ctx) {
            ctx.ui.notify(message, "error");
        }
        console.error(`[ERROR] ${message}`);
    }
}
