/**
 * =================================================================================
 * TESTING MOCKS
 * =================================================================================
 * This file provides mock objects for the Pi Extension API and Context.
 * A good mock is the cornerstone of unit testing. It allows you to:
 *
 *  1. Isolate your code from the main Pi agent.
 *  2. Spy on function calls (e.g., "was `registerTool` called?").
 *  3. Fake return values (e.g., make `getFlag` return `true`).
 *  4. Simulate events (e.g., fire a fake `tool_call` event).
 *
 */
import { vi } from "bun:test";
import type { ExtensionAPI, ExtensionContext, ExtensionEvent } from "@mariozechner/pi-coding-agent";

// A repository to store registered items so we can inspect them in tests.
const MOCK_REGISTRY = {
  tools: new Map<string, any>(),
  commands: new Map<string, any>(),
  events: new Map<string, any[]>(),
  flags: new Map<string, any>(),
  shortcuts: new Map<string, any>(),
  entries: [] as any[],
};

/**
 * Creates a mock `ExtensionContext` object.
 * We use `vi.fn()` to create spies for all UI interaction methods.
 */
export function createMockContext(): ExtensionContext {
  return {
    ui: {
      notify: vi.fn(),
      confirm: vi.fn().mockResolvedValue(true), // Default to "yes" for confirmation prompts
      showToast: vi.fn(),
      setWidget: vi.fn(),
      // You can add spies for other UI methods here
    },
  } as any;
}

/**
 * Creates a mock `ExtensionAPI` object.
 * This is the heart of our testing setup.
 */
export function createMockApi(): ExtensionAPI & { __unstable_getRegistry: () => typeof MOCK_REGISTRY, __unstable_fireEvent: (type: ExtensionEvent['type'], payload: any) => Promise<any> } {
  // Clear the registry for each test to ensure isolation.
  MOCK_REGISTRY.tools.clear();
  MOCK_REGISTRY.commands.clear();
  MOCK_REGISTRY.events.clear();
  MOCK_REGISTRY.flags.clear();
  MOCK_REGISTRY.shortcuts.clear();
  MOCK_REGISTRY.entries = [];

  const api = {
    log: vi.fn(),
    registerTool: vi.fn((tool) => MOCK_REGISTRY.tools.set(tool.name, tool)),
    registerCommand: vi.fn((name, cmd) => MOCK_REGISTRY.commands.set(name, cmd)),
    on: vi.fn((name, handler) => {
      if (!MOCK_REGISTRY.events.has(name)) MOCK_REGISTRY.events.set(name, []);
      MOCK_REGISTRY.events.get(name)!.push(handler);
    }),
    registerFlag: vi.fn((name, flag) => MOCK_REGISTRY.flags.set(name, flag)),
    getFlag: vi.fn((name: string) => MOCK_REGISTRY.flags.get(name)?.default),
    registerShortcut: vi.fn((shortcut, handler) => MOCK_REGISTRY.shortcuts.set(shortcut, handler)),
    exec: vi.fn().mockResolvedValue({ stdout: "", stderr: "", exitCode: 0, code: 0 }),
    
    // Mock state management functions
    getEntries: vi.fn(() => MOCK_REGISTRY.entries),
    appendEntry: vi.fn((entry) => MOCK_REGISTRY.entries.push(entry)),

    // Add spies for other API methods you want to test
    getSessionName: vi.fn().mockReturnValue("test-session"),

    // Special methods for testing
    __unstable_getRegistry: () => MOCK_REGISTRY,
    __unstable_fireEvent: async (type: ExtensionEvent['type'], payload: any, ctx?: ExtensionContext) => {
        const handlers = MOCK_REGISTRY.events.get(type) || [];
        const results = [];
        const mockCtx = ctx || createMockContext();
        for (const handler of handlers) {
            results.push(await handler({ type, ...payload }, mockCtx));
        }
        return results;
    }
  };

  return api as any;
}
