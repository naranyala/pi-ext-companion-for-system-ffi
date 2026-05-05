/**
 * Session Analytics Service - Track and analyze session statistics
 */
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Logger } from "./logger";

export interface SessionStats {
  sessionStart: number;
  sessionEnd?: number;
  totalTurns: number;
  totalToolCalls: number;
  toolCallsByType: Record<string, number>;
  totalTokensUsed: number;
  averageTokensPerTurn: number;
  errorsEncountered: number;
  ffiDetections: number;
  modelSwitches: number;
  compactCount: number;
}

export interface ToolCallRecord {
  toolName: string;
  timestamp: number;
  duration: number;
  success: boolean;
  error?: string;
}

export class SessionAnalyticsService {
  private stats: SessionStats;
  private toolCalls: ToolCallRecord[] = [];
  private turnStartTimes: Map<number, number> = new Map();
  private currentTurnStart?: number;

  constructor(
    private readonly logger: Logger,
    private readonly sessionId: string
  ) {
    this.stats = {
      sessionStart: Date.now(),
      totalTurns: 0,
      totalToolCalls: 0,
      toolCallsByType: {},
      totalTokensUsed: 0,
      averageTokensPerTurn: 0,
      errorsEncountered: 0,
      ffiDetections: 0,
      modelSwitches: 0,
      compactCount: 0,
    };
  }

  recordTurnStart(turnIndex: number): void {
    this.currentTurnStart = Date.now();
    this.turnStartTimes.set(turnIndex, this.currentTurnStart);
    this.stats.totalTurns++;
  }

  recordTurnEnd(turnIndex: number, message?: any): void {
    const startTime = this.turnStartTimes.get(turnIndex);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.logger.info(`Turn ${turnIndex} completed in ${duration}ms`);
    }

    if (message?.usage) {
      this.stats.totalTokensUsed += message.usage.total_tokens || 0;
      this.stats.averageTokensPerTurn = this.stats.totalTokensUsed / this.stats.totalTurns;
    }
  }

  recordToolCall(toolName: string, success: boolean, error?: string): void {
    this.stats.totalToolCalls++;
    this.stats.toolCallsByType[toolName] = (this.stats.toolCallsByType[toolName] || 0) + 1;

    if (!success) {
      this.stats.errorsEncountered++;
    }

    this.toolCalls.push({
      toolName,
      timestamp: Date.now(),
      duration: 0,
      success,
      error,
    });
  }

  recordFFIDetection(): void {
    this.stats.ffiDetections++;
  }

  recordModelSwitch(): void {
    this.stats.modelSwitches++;
  }

  recordCompaction(): void {
    this.stats.compactCount++;
  }

  getStats(): SessionStats {
    return {
      ...this.stats,
      sessionEnd: Date.now(),
    };
  }

  getToolCallHistory(): ToolCallRecord[] {
    return [...this.toolCalls];
  }

  generateReport(): string {
    const stats = this.getStats();
    const duration = stats.sessionEnd
      ? ((stats.sessionEnd - stats.sessionStart) / 1000 / 60).toFixed(1)
      : "ongoing";

    let report = `# Session Analytics Report\n\n`;
    report += `**Duration**: ${duration} minutes\n`;
    report += `**Total Turns**: ${stats.totalTurns}\n`;
    report += `**Total Tool Calls**: ${stats.totalToolCalls}\n`;
    report += `**Total Tokens Used**: ${stats.totalTokensUsed.toLocaleString()}\n`;
    report += `**Avg Tokens/Turn**: ${Math.round(stats.averageTokensPerTurn).toLocaleString()}\n`;
    report += `**Errors**: ${stats.errorsEncountered}\n`;
    report += `**FFI Detections**: ${stats.ffiDetections}\n`;
    report += `**Model Switches**: ${stats.modelSwitches}\n`;
    report += `**Compactions**: ${stats.compactCount}\n\n`;

    report += `## Tool Usage\n`;
    const sortedTools = Object.entries(stats.toolCallsByType).sort((a, b) => b[1] - a[1]);
    for (const [tool, count] of sortedTools) {
      report += `- **${tool}**: ${count} calls\n`;
    }

    if (this.toolCalls.length > 0) {
      report += `\n## Recent Tool Calls\n`;
      const recent = this.toolCalls.slice(-10);
      for (const call of recent) {
        const status = call.success ? "✓" : "✗";
        report += `- ${status} ${call.toolName} at ${new Date(call.timestamp).toLocaleTimeString()}\n`;
      }
    }

    return report;
  }

  reset(): void {
    this.stats = {
      sessionStart: Date.now(),
      totalTurns: 0,
      totalToolCalls: 0,
      toolCallsByType: {},
      totalTokensUsed: 0,
      averageTokensPerTurn: 0,
      errorsEncountered: 0,
      ffiDetections: 0,
      modelSwitches: 0,
      compactCount: 0,
    };
    this.toolCalls = [];
    this.turnStartTimes.clear();
  }
}
