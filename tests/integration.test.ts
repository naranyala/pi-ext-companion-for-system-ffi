import { describe, expect, it, beforeEach, vi } from "bun:test";
import extension from "../src/index";
import { createMockApi, createMockContext } from "./mocks";

describe("Integration Test", () => {
  let api: ReturnType<typeof createMockApi>;
  let ctx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    api = createMockApi();
    ctx = createMockContext();
  });

  it("should initialize all services and features on startup", () => {
    extension(api);
    const { commands, tools } = api.__unstable_getRegistry();
    
    expect(api.registerFlag).toHaveBeenCalled();
    expect(api.on).toHaveBeenCalledWith("session_start", expect.any(Function));

    expect(commands.size).toBeGreaterThan(0);
    expect(tools.size).toBeGreaterThan(0);

    expect(commands.has("ffi-detect")).toBe(true);
  });

  it("should correctly run the session_start lifecycle", async () => {
    extension(api);
    (api.getFlag as vi.SpiedFunction<any>).mockReturnValue("Integ-Tester");

    await api.__unstable_fireEvent("session_start", {});

    expect(api.getEntries).toHaveBeenCalled();
    expect(api.appendEntry).toHaveBeenCalledWith(expect.objectContaining({
      value: { sessionCount: 1, todoList: [] }
    }));
  });
});
