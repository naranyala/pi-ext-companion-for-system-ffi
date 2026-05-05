/**
 * Analytics Tools - Expose session analytics to the LLM
 */
import type { Services } from "../../core/services";
import { SessionAnalyticsService } from "./service";
import { SessionDashboard } from "./dashboard";
import { Type } from "@sinclair/typebox";

export class AnalyticsTools {
  constructor(private readonly services: Services) {}

  register() {
    const { api, logger } = this.services;

    api.registerTool({
      name: "ffi_show_dashboard",
      description: "Open an interactive TUI dashboard showing real-time session analytics.",
      parameters: Type.Object({}),
      execute: async (_id, _params, _signal, _onUpdate, ctx) => {
        const analytics = this.getAnalyticsService(ctx);
        const dashboard = new SessionDashboard(analytics);

        // Use custom TUI component
        await (ctx as any).ui.custom(dashboard);

        return {
          content: [{ type: "text", text: "Dashboard closed." }],
        };
      },
    });

    api.registerTool({
      name: "ffi_session_stats",
      description: "Get current session statistics including token usage, tool calls, and errors.",
      parameters: Type.Object({}),
      execute: async (_id, _params, _signal, _onUpdate, ctx) => {
        const analytics = this.getAnalyticsService(ctx);
        const stats = analytics.getStats();
        const report = analytics.generateReport();

        return {
          content: [{ type: "text", text: report }],
          details: stats,
        };
      },
    });

    api.registerTool({
      name: "ffi_tool_usage",
      description: "Get detailed tool usage history for the current session.",
      parameters: Type.Object({
        toolName: Type.Optional(Type.String({ description: "Filter by specific tool name" })),
        limit: Type.Optional(Type.Number({ description: "Max number of records to return (default 20)" })),
      }),
      execute: async (_id, params, _signal, _onUpdate, ctx) => {
        const analytics = this.getAnalyticsService(ctx);
        let history = analytics.getToolCallHistory();

        if (params.toolName) {
          history = history.filter(h => h.toolName === params.toolName);
        }

        const limit = params.limit || 20;
        const recent = history.slice(-limit);

        const text = recent.map(h =>
          `${h.success ? '✓' : '✗'} ${h.toolName} at ${new Date(h.timestamp).toLocaleTimeString()}${h.error ? ` - ${h.error}` : ''}`
        ).join('\n');

        return {
          content: [{ type: "text", text: `## Tool Call History (last ${recent.length})\n\n${text}` }],
          details: recent,
        };
      },
    });

    api.registerTool({
      name: "ffi_session_health",
      description: "Check session health: token usage, error rate, and recommendations.",
      parameters: Type.Object({}),
      execute: async (_id, _params, _signal, _onUpdate, ctx) => {
        const analytics = this.getAnalyticsService(ctx);
        const stats = analytics.getStats();

        let health = "## Session Health Check\n\n";
        health += `**Status**: ${stats.errorsEncountered === 0 ? '✓ Healthy' : '⚠ Needs Attention'}\n`;
        health += `**Error Rate**: ${((stats.errorsEncountered / stats.totalToolCalls) * 100 || 0).toFixed(1)}%\n`;
        health += `**Token Usage**: ${stats.totalTokensUsed.toLocaleString()} tokens\n`;

        if (stats.totalTokensUsed > 100000) {
          health += `\n**Recommendation**: Consider using /compact to reduce context size.\n`;
        }

        if (stats.errorsEncountered > stats.totalToolCalls * 0.1) {
          health += `**Recommendation**: High error rate detected. Check tool configurations.\n`;
        }

        return {
          content: [{ type: "text", text: health }],
          details: {
            healthScore: stats.errorsEncountered === 0 ? 100 : Math.max(0, 100 - (stats.errorsEncountered / stats.totalToolCalls) * 100),
          },
        };
      },
    });
  }

  private getAnalyticsService(ctx: any): SessionAnalyticsService {
    // Get or create analytics service for this session
    const session = ctx?.sessionManager;
    if (session) {
      const existing = (session as any)._analyticsService;
      if (existing) return existing;
      const service = new SessionAnalyticsService(this.services.logger, session.getSessionFile() || 'unknown');
      (session as any)._analyticsService = service;
      return service;
    }
    return new SessionAnalyticsService(this.services.logger, 'unknown');
  }
}
