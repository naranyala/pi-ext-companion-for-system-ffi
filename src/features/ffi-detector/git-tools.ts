/**
 * Git Tools for FFI Projects - Help analyze FFI related changes in git
 */
import type { Services } from "../../core/services";
import { Type } from "@sinclair/typebox";

export class FFIGitTools {
  constructor(private readonly services: Services) {}

  register() {
    const { api } = this.services;

    api.registerTool({
      name: "ffi_git_status",
      description: "Check for modified or untracked FFI-related files in the current git repository.",
      parameters: Type.Object({
        pattern: Type.Optional(Type.String({ description: "Optional pattern to filter files (e.g. '.h', '.cpp')" })),
      }),
      execute: async (_id, params, _signal, _onUpdate, ctx) => {
        const git = this.services.git;
        if (!(await git.isGitRepo())) {
          return { content: [{ type: "text", text: "The current directory is not a git repository." }] };
        }

        const status = await git.getStatus(params.pattern);
        return {
          content: [{ type: "text", text: status ? `## FFI Git Status\n\n${status}` : "No FFI-related changes detected." }],
        };
      },
    });

    api.registerTool({
      name: "ffi_git_history",
      description: "Get recent git commit history for FFI-related files.",
      parameters: Type.Object({
        file: Type.Optional(Type.String({ description: "Specific file to track" })),
        limit: Type.Optional(Type.Number({ description: "Number of commits to return (default 10)" })),
      }),
      execute: async (_id, params, _signal, _onUpdate, ctx) => {
        const git = this.services.git;
        if (!(await git.isGitRepo())) {
          return { content: [{ type: "text", text: "The current directory is not a git repository." }] };
        }

        const log = await git.getLog(params.file, params.limit || 10);
        return {
          content: [{ type: "text", text: log ? `## FFI Git History\n\n${log}` : "No history found." }],
        };
      },
    });

    api.registerTool({
      name: "ffi_git_diff",
      description: "Show the diff of a specific FFI-related file against HEAD.",
      parameters: Type.Object({
        file: Type.String({ description: "The path to the FFI file to diff" }),
      }),
      execute: async (_id, params, _signal, _onUpdate, ctx) => {
        const git = this.services.git;
        if (!(await git.isGitRepo())) {
          return { content: [{ type: "text", text: "The current directory is not a git repository." }] };
        }

        const diff = await git.getDiff(params.file);
        return {
          content: [{ type: "text", text: diff ? `## Diff for ${params.file}\n\n${diff}` : "No differences found." }],
        };
      },
    });
  }
}
