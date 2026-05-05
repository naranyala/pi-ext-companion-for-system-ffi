/**
 * Quality Tools - Integrate linters and formatters (e.g., Biome)
 */
import type { Services } from "../../core/services";
import { Type } from "@sinclair/typebox";

export class QualityTools {
  constructor(private readonly services: Services) {}

  register() {
    const { api } = this.services;

    api.registerTool({
      name: "run_lint",
      description: "Run the project linter (Biome) to find code smells and errors.",
      parameters: Type.Object({
        path: Type.Optional(Type.String({ description: "Specific file or directory to lint (default: current project)" })),
      }),
      execute: async (_id, params, _signal, _onUpdate, ctx) => {
        const target = params.path || ".";
        _onUpdate(`Running Biome lint on ${target}...`);
        
        try {
          const output = await this.services.shell.exec("bun", ["x", "biome", "lint", target]);
          return {
            content: [{ type: "text", text: `## Linting Results for ${target}\n\n${output}` }],
          };
        } catch (e: any) {
          return {
            content: [{ type: "text", text: `## Linting Issues Found\n\n${e.message || e}` }],
          };
        }
      },
    });

    api.registerTool({
      name: "run_format",
      description: "Run the project formatter (Biome) to fix formatting issues.",
      parameters: Type.Object({
        path: Type.Optional(Type.String({ description: "Specific file or directory to format (default: current project)" })),
      }),
      execute: async (_id, params, _signal, _onUpdate, ctx) => {
        const target = params.path || ".";
        _onUpdate(`Formatting ${target}...`);

        try {
          const output = await this.services.shell.exec("bun", ["x", "biome", "format", "--write", target]);
          return {
            content: [{ type: "text", text: `## Formatting Complete\n\n${output}` }],
          };
        } catch (e: any) {
          return {
            content: [{ type: "text", text: `## Formatting Failed\n\n${e.message || e}` }],
          };
        }
      },
    });

    api.registerTool({
      name: "run_check",
      description: "Run 'biome check' to combine linting, formatting, and organizing imports.",
      parameters: Type.Object({
        path: Type.Optional(Type.String({ description: "Specific file or directory to check (default: current project)" })),
        apply: Type.Optional(Type.Boolean({ description: "Apply safe fixes automatically (default: false)" })),
      }),
      execute: async (_id, params, _signal, _onUpdate, ctx) => {
        const target = params.path || ".";
        const args = ["x", "biome", "check"];
        if (params.apply) args.push("--apply");
        args.push(target);

        _onUpdate(`Running Biome check on ${target}...`);
        try {
          const output = await this.services.shell.exec("bun", args);
          return {
            content: [{ type: "text", text: `## Check Results for ${target}\n\n${output}` }],
          };
        } catch (e: any) {
          return {
            content: [{ type: "text", text: `## Issues Found\n\n${e.message || e}` }],
          };
        }
      },
    });
  }
}
