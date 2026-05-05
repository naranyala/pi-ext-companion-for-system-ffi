/**
 * The FloatingContext service provides high-level abstractions over the
 * raw ExtensionContext for common, complex interactions.
 */
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";

export class FloatingContext {
    /**
     * Encapsulates the logic for a "permission gate" on a dangerous action.
     * @returns `true` if the action is allowed, `false` otherwise.
     */
    async confirmDangerousAction(ctx: ExtensionContext, actionDescription: string): Promise<boolean> {
        const ok = await ctx.ui.confirm("⚠️ DANGER", `The AI wants to perform a potentially dangerous action:\n\n\`${actionDescription}\`\n\nDo you want to allow this?`);
        return ok;
    }
}
