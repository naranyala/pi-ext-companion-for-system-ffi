/**
 * The NotificationService centralizes UI feedback, allowing for formatted 
 * notifications and potential queueing/throttling.
 */
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";

export type NotificationLevel = "info" | "warning" | "error" | "success";

export class NotificationService {
  /**
   * Sends a notification to the user via the current context.
   */
  notify(ctx: ExtensionContext, message: string, level: NotificationLevel = "info") {
    const icons = {
      info: "ℹ️",
      warning: "⚠️",
      error: "❌",
      success: "✅",
    };
    
    const formattedMessage = `${icons[level]} ${message}`;
    ctx.ui.notify(formattedMessage, level === "success" ? "info" : level);
  }
}
