/**
 * Example: Using Pi-Mono Primitives
 *
 * This shows how to build extensions using the primitives library.
 */
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { createPiMonoClients, type ToolDef, type CommandDef } from "../src/core/pi-mono-primitives";

export default function (api: ExtensionAPI) {
  // Create client with all primitives
  const pi = createPiMonoClients(api);

  // Use event primitive
  pi.on("session_start", async (_event, ctx) => {
    const ui = pi.getUI(ctx);
    ui.notify("Extension loaded with primitives!", "info");
  });

  // Use tool primitive
  const greetTool: ToolDef = {
    name: "greet",
    description: "Greet someone",
    parameters: { type: "object", properties: { name: { type: "string" } } },
    execute: async (_id, params) => {
      return { content: [{ type: "text", text: `Hello, ${params.name}!` }] };
    },
  };
  pi.registerTool(greetTool);

  // Use command primitive
  const helloCmd: CommandDef = {
    name: "hello",
    description: "Say hello",
    handler: async (args, ctx) => {
      const ui = pi.getUI(ctx);
      ui.notify(`Hello ${args || "world"}!`, "info");
    },
  };
  pi.registerCommand(helloCmd);

  // Use shell primitive
  pi.on("tool_call", async (event: any, _ctx) => {
    if (event.toolName === "bash") {
      const shell = pi.getShell();
      const result = await shell.exec("echo", ["test"]);
      console.log("Shell result:", result.stdout);
    }
  });

  // Use state primitive
  const state = pi.getState();
  pi.on("session_start", () => {
    const entries = state.getEntries();
    console.log("Session has", entries.length, "entries");
  });

  // Use session primitive
  pi.on("tool_result", async (_event: any, ctx) => {
    const session = pi.getSession(ctx);
    console.log("CWD:", session.cwd);
  });
}
