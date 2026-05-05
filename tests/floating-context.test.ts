import { describe, expect, it, beforeEach, vi } from "bun:test";
import { FloatingContext } from "../src/core/floating-context";
import { createMockContext } from "./mocks";

describe("Core Service: FloatingContext", () => {
  let floatingContext: FloatingContext;
  let ctx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    floatingContext = new FloatingContext();
    ctx = createMockContext();
  });

  describe("confirmDangerousAction()", () => {
    it("should call ctx.ui.confirm with danger icon and action description", async () => {
      await floatingContext.confirmDangerousAction(ctx, "rm -rf /");

      expect(ctx.ui.confirm).toHaveBeenCalledWith(
        "⚠️ DANGER",
        expect.stringContaining("rm -rf /")
      );
    });

    it("should return true when user confirms", async () => {
      (ctx.ui.confirm as vi.SpiedFunction<any>).mockResolvedValue(true);

      const result = await floatingContext.confirmDangerousAction(ctx, "delete all");

      expect(result).toBe(true);
    });

    it("should return false when user denies", async () => {
      (ctx.ui.confirm as vi.SpiedFunction<any>).mockResolvedValue(false);

      const result = await floatingContext.confirmDangerousAction(ctx, "format c:");

      expect(result).toBe(false);
    });

    it("should format message with code block for action", async () => {
      await floatingContext.confirmDangerousAction(ctx, "dd if=/dev/zero of=/dev/sda");

      expect(ctx.ui.confirm).toHaveBeenCalledWith(
        "⚠️ DANGER",
        expect.stringContaining("dd if=/dev/zero of=/dev/sda")
      );
    });

    it("should include the action in the prompt message", async () => {
      await floatingContext.confirmDangerousAction(ctx, "drop database");

      expect(ctx.ui.confirm).toHaveBeenCalledWith(
        "⚠️ DANGER",
        expect.stringContaining("The AI wants to perform a potentially dangerous action:")
      );
    });
  });
});