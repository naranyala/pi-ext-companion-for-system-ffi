import { describe, expect, it, beforeEach, vi } from "bun:test";
import { ConfigValidator } from "../src/core/validation";
import { createMockApi } from "./mocks";
import { FLAG_USERNAME } from "../src/core/constants";

describe("Core Service: ConfigValidator", () => {
  let api: ReturnType<typeof createMockApi>;

  beforeEach(() => {
    api = createMockApi();
  });

  it("should register all flags on initialization", () => {
    new ConfigValidator(api);
    expect(api.registerFlag).toHaveBeenCalledWith(FLAG_USERNAME, expect.any(Object));
  });

  it("should return the correct config values from flags", () => {
    // Mock the return value of getFlag for this test
    (api.getFlag as vi.SpiedFunction<any>).mockImplementation((flagName: string) => {
      if (flagName === FLAG_USERNAME) return "Tester";
      return true;
    });

    const validator = new ConfigValidator(api);
    const config = validator.get();

    expect(config.username).toBe("Tester");
    expect(config.useGitCheckpoint).toBe(true);
  });
});
