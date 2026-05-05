/**
 * Pi-Mono API Primitives - Simplified, working version
 */
import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";

// =================================================================================
// CORE EXPORTS
// =================================================================================

export type { ExtensionAPI, ExtensionContext };

// =================================================================================
// TOOL PRIMITIVE
// =================================================================================

export interface ToolDef {
  name: string;
  label?: string;
  description: string;
  parameters: any;
  execute: (toolCallId: string, params: any, signal: AbortSignal, onUpdate: (text: string) => void, ctx: ExtensionContext) => Promise<any>;
}

export function registerTool(api: ExtensionAPI, tool: ToolDef): void {
  (api as any).registerTool({
    name: tool.name,
    label: tool.label,
    description: tool.description,
    parameters: tool.parameters,
    execute: tool.execute,
  });
}

// =================================================================================
// COMMAND PRIMITIVE
// =================================================================================

export interface CommandDef {
  name: string;
  description: string;
  handler: (args: string, ctx: any) => void | Promise<any>;
}

export function registerCommand(api: ExtensionAPI, cmd: CommandDef): void {
  (api as any).registerCommand(cmd.name, {
    description: cmd.description,
    handler: cmd.handler,
  });
}

export function registerShortcut(api: ExtensionAPI, shortcut: string, description: string, handler: (ctx: any) => void | Promise<void>): void {
  (api as any).registerShortcut?.(shortcut, { description, handler });
}

// =================================================================================
// EVENT PRIMITIVE
// =================================================================================

export function onEvent(api: ExtensionAPI, eventType: string, handler: (event: any, ctx: any) => any): void {
  (api as any).on(eventType, handler);
}

// =================================================================================
// UI PRIMITIVE
// =================================================================================

export function getUI(ctx: ExtensionContext): any {
  return {
    notify: (msg: string, level = "info") => (ctx as any).ui?.notify(msg, level),
    confirm: (title: string, msg: string) => (ctx as any).ui?.confirm(title, msg) || Promise.resolve(false),
    select: (title: string, options: string[]) => (ctx as any).ui?.select(title, options) || Promise.resolve(undefined),
    input: (title: string, placeholder?: string) => (ctx as any).ui?.input(title, placeholder) || Promise.resolve(undefined),
  };
}

// =================================================================================
// STATE PRIMITIVE
// =================================================================================

export function getState(api: ExtensionAPI): any {
  return {
    appendEntry: (type: string, value: any) => (api as any).appendEntry?.({ type, value }),
    getEntries: () => (api as any).getEntries?.() || [],
  };
}

// =================================================================================
// SHELL PRIMITIVE
// =================================================================================

export function getShell(api: ExtensionAPI): any {
  return {
    exec: (command: string, args: string[] = []) => (api as any).exec(command, args),
  };
}

// =================================================================================
// SESSION PRIMITIVE
// =================================================================================

export function getSession(ctx: ExtensionContext): any {
  return {
    cwd: (ctx as any).cwd,
    hasUI: (ctx as any).hasUI,
    signal: (ctx as any).signal,
    getEntries: () => (ctx as any).sessionManager?.getEntries() || [],
    getSessionFile: () => (ctx as any).sessionManager?.getSessionFile(),
  };
}

// =================================================================================
// FLAG PRIMITIVE
// =================================================================================

export function registerFlag(api: ExtensionAPI, name: string, type: string, description: string, defaultVal: any): void {
  (api as any).registerFlag(name, { type, description, default: defaultVal });
}

export function getFlag(api: ExtensionAPI, name: string): any {
  return (api as any).getFlag(name);
}

// =================================================================================
// COMBINED CLIENT
// =================================================================================

export function createPiMonoClients(api: ExtensionAPI): any {
  return {
    api,
    registerTool: (tool: ToolDef) => registerTool(api, tool),
    registerCommand: (cmd: CommandDef) => registerCommand(api, cmd),
    registerShortcut: (shortcut: string, desc: string, handler: any) => registerShortcut(api, shortcut, desc, handler),
    on: (event: string, handler: any) => onEvent(api, event, handler),
    getUI: (ctx: ExtensionContext) => getUI(ctx),
    getState: () => getState(api),
    getShell: () => getShell(api),
    getSession: (ctx: ExtensionContext) => getSession(ctx),
    registerFlag: (name: string, type: string, desc: string, defaultVal: any) => registerFlag(api, name, type, desc, defaultVal),
    getFlag: (name: string) => getFlag(api, name),
  };
}

export default createPiMonoClients;
