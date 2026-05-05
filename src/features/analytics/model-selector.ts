/**
 * Smart Model Selector - Suggest optimal models based on task type
 */
import type { Services } from "../../core/services";
import { Type } from "@sinclair/typebox";

export interface ModelProfile {
  id: string;
  provider: string;
  strengths: string[];
  contextWindow: number;
  supportsThinking: boolean;
}

export const MODEL_PROFILES: ModelProfile[] = [
  {
    id: 'claude-3-5-sonnet-20241022',
    provider: 'anthropic',
    strengths: ['reasoning', 'code-generation', 'ffi-analysis'],
    contextWindow: 200000,
    supportsThinking: true,
  },
  {
    id: 'gpt-4',
    provider: 'openai',
    strengths: ['reasoning', 'text-analysis'],
    contextWindow: 128000,
    supportsThinking: false,
  },
  {
    id: 'gemini-pro',
    provider: 'google',
    strengths: ['long-context', 'code-analysis'],
    contextWindow: 1000000,
    supportsThinking: false,
  },
  {
    id: 'local-model',
    provider: 'local',
    strengths: ['privacy', 'offline'],
    contextWindow: 4096,
    supportsThinking: false,
  },
];

export class SmartModelSelector {
  constructor(private readonly services: Services) {}

  register() {
    const { api, logger } = this.services;

    api.registerTool({
      name: 'recommend_model',
      description: 'Recommend the best model for the current task based on task type and context size.',
      parameters: Type.Object({
        taskType: Type.String({ description: 'Type of task: ffi-analysis, code-generation, debugging, documentation, general' }),
        contextSize: Type.Optional(Type.Number({ description: 'Current context size in tokens (optional)' })),
        requireThinking: Type.Optional(Type.Boolean({ description: 'Whether the task benefits from thinking/reasoning' })),
      }),
      execute: async (_id, params, _signal, _onUpdate, ctx) => {
        const profiles = this.getModelProfiles();
        const contextSize = params.contextSize || this.getContextUsage(ctx)?.tokens || 0;

        let recommendations = this.recommendModels(params.taskType, contextSize, params.requireThinking || false);

        if (recommendations.length === 0) {
          recommendations = profiles.filter(p => p.contextWindow >= contextSize);
        }

        const text = this.formatRecommendations(recommendations, params.taskType, contextSize);

        return {
          content: [{ type: 'text', text: text }],
          details: { recommendations: recommendations.map(r => r.id) },
        };
      },
    });

    api.registerTool({
      name: 'switch_model_if_needed',
      description: 'Automatically switch to a better model if current model is unsuitable for the task.',
      parameters: Type.Object({
        taskType: Type.String({ description: 'Type of task being performed' }),
        reason: Type.Optional(Type.String({ description: 'Reason for potential switch' })),
      }),
      execute: async (_id, params, _signal, _onUpdate, ctx) => {
        const currentModel = this.getCurrentModel();
        const profiles = this.getModelProfiles();
        const currentProfile = profiles.find(p => p.id === currentModel);

        const taskProfiles = this.recommendModels(params.taskType, 0, false);
        const betterModel = taskProfiles.find(p => p.id !== currentModel);

        if (betterModel && currentProfile) {
          const reason = params.reason || `Switching to ${betterModel.id} for better ${params.taskType} performance`;
          
          // In a real implementation, this would call pi.setModel()
          return {
            content: [{ type: 'text', text: `## Model Switch Recommended\n\nCurrent: ${currentModel}\nRecommended: ${betterModel.id}\n\nReason: ${reason}\n\nUse /model to switch manually.` }],
            details: { switchRecommended: true, from: currentModel, to: betterModel.id },
          };
        }

        return {
          content: [{ type: 'text', text: `Current model (${currentModel}) is suitable for ${params.taskType}.` }],
          details: { switchRecommended: false },
        };
      },
    });

    // Register event handlers for model tracking
    try {
      api.on('model_select', (_event: any) => {
        const analytics = this.getAnalyticsService();
        analytics?.recordModelSwitch();
      });
    } catch (e) {
      logger.warn(`Failed to register model_select handler: ${e}`);
    }
  }

  private getModelProfiles(): ModelProfile[] {
    // In a real implementation, this would read from pi.getModels()
    return MODEL_PROFILES;
  }

  private recommendModels(taskType: string, contextSize: number, requireThinking: boolean): ModelProfile[] {
    const profiles = this.getModelProfiles();

    return profiles
      .filter(p => {
        if (contextSize > 0 && p.contextWindow < contextSize) return false;
        if (requireThinking && !p.supportsThinking) return false;
        
        const taskLower = taskType.toLowerCase();
        return p.strengths.some(s => s.includes(taskLower) || taskLower.includes(s));
      })
      .sort((a, b) => b.contextWindow - a.contextWindow);
  }

  private formatRecommendations(profiles: ModelProfile[], taskType: string, contextSize: number): string {
    let text = `## Model Recommendations for: ${taskType}\n\n`;
    text += `**Context Size**: ${contextSize.toLocaleString()} tokens\n\n`;

    if (profiles.length === 0) {
      text += 'No models found matching criteria. Using default recommendations.\n';
      return text;
    }

    text += `### Top Recommendations\n\n`;
    for (const profile of profiles.slice(0, 3)) {
      text += `- **${profile.id}** (${profile.provider})\n`;
      text += `  - Context: ${profile.contextWindow.toLocaleString()} tokens\n`;
      text += `  - Strengths: ${profile.strengths.join(', ')}\n`;
      text += `  - Thinking: ${profile.supportsThinking ? 'Yes' : 'No'}\n\n`;
    }

    return text;
  }

  private getCurrentModel(): string {
    try {
      return this.services.api.getModel?.()?.id || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private getContextUsage(ctx: any): { tokens: number } | null {
    try {
      return ctx?.getContextUsage?.() || null;
    } catch {
      return null;
    }
  }

  private getAnalyticsService(): SessionAnalyticsService | null {
    // This would get the analytics service from session - simplified for now
    return null;
  }
}
