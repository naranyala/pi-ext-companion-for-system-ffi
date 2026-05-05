/**
 * Session Dashboard Component - Visualizes session analytics in the TUI
 */
import { type Component } from "@mariozechner/pi-tui";
import { SessionAnalyticsService, type SessionStats } from "./service";

export class SessionDashboard implements Component {
  private stats: SessionStats;

  constructor(private readonly analytics: SessionAnalyticsService) {
    this.stats = this.analytics.getStats();
  }

  invalidate(): void {
    this.stats = this.analytics.getStats();
  }

  render(width: number): string[] {
    const lines: string[] = [];
    const theme = {
      primary: "\x1b[34m", // Blue
      success: "\x1b[32m", // Green
      warn: "\x1b[33m",    // Yellow
      error: "\x1b[31m",   // Red
      reset: "\x1b[0m",
      bold: "\x1b[1m",
    };

    // Header
    lines.push(`${theme.bold}${theme.primary}📊 SESSION ANALYTICS DASHBOARD${theme.reset}`);
    lines.push("─".repeat(Math.min(width, 40)));

    // Core Stats
    const duration = this.calculateDuration();
    lines.push(`${theme.bold}Duration:${theme.reset} ${duration}`);
    lines.push(`${theme.bold}Total Turns:${theme.reset} ${this.stats.totalTurns}`);
    lines.push(`${theme.bold}Tool Calls:${theme.reset} ${this.stats.totalToolCalls}`);
    lines.push(`${theme.bold}Tokens Used:${theme.reset} ${this.stats.totalTokensUsed.toLocaleString()}`);

    lines.push("");

    // Health Status
    const errorRate = (this.stats.errorsEncountered / this.stats.totalToolCalls) * 100 || 0;
    const healthColor = errorRate === 0 ? theme.success : errorRate < 10 ? theme.warn : theme.error;
    const healthStatus = errorRate === 0 ? "Healthy" : errorRate < 10 ? "Warning" : "Critical";
    lines.push(`${theme.bold}Session Health:${theme.reset} ${healthColor}● ${healthStatus} (${errorRate.toFixed(1)}% error rate)${theme.reset}`);

    lines.push("");

    // Tool Breakdown
    lines.push(`${theme.bold}Tool Usage Breakdown:${theme.reset}`);
    const sortedTools = Object.entries(this.stats.toolCallsByType).sort((a, b) => b[1] - a[1]);
    
    if (sortedTools.length === 0) {
      lines.push("  No tool calls yet");
    } else {
      sortedTools.forEach(([name, count]) => {
        const bar = "■".repeat(Math.min(10, Math.floor(count / 1))); // Simple bar
        lines.push(`  ${name.padEnd(15)} ${theme.primary}${bar}${theme.reset} ${count}`);
      });
    }

    lines.push("");
    lines.push("─".repeat(Math.min(width, 40)));
    lines.push(`Press \x1b[ESC] or close tool to exit`);

    return lines;
  }

  private calculateDuration(): string {
    const now = Date.now();
    const diff = now - this.stats.sessionStart;
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}m ${secs}s`;
  }
}
