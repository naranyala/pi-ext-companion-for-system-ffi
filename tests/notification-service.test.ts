import { describe, expect, it, beforeEach } from "bun:test";
import { NotificationService } from "../src/core/notification-service";
import { createMockContext } from "./mocks";

describe("Core Service: NotificationService", () => {
  let notificationService: NotificationService;
  let ctx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    notificationService = new NotificationService();
    ctx = createMockContext();
  });

  it("should send notification with info level", () => {
    notificationService.notify(ctx, "Test message", "info");
    expect(ctx.ui.notify).toHaveBeenCalledWith("ℹ️ Test message", "info");
  });

  it("should send notification with warning level", () => {
    notificationService.notify(ctx, "Warning text", "warning");
    expect(ctx.ui.notify).toHaveBeenCalledWith("⚠️ Warning text", "warning");
  });

  it("should send notification with error level", () => {
    notificationService.notify(ctx, "Error occurred", "error");
    expect(ctx.ui.notify).toHaveBeenCalledWith("❌ Error occurred", "error");
  });

  it("should send notification with success level but 'info' notification type", () => {
    notificationService.notify(ctx, "Operation complete", "success");
    expect(ctx.ui.notify).toHaveBeenCalledWith("✅ Operation complete", "info");
  });

  it("should default to info level when no level specified", () => {
    notificationService.notify(ctx, "Default message");
    expect(ctx.ui.notify).toHaveBeenCalledWith("ℹ️ Default message", "info");
  });

  it("should format all notification types consistently", () => {
    notificationService.notify(ctx, "A", "info");
    notificationService.notify(ctx, "B", "warning");
    notificationService.notify(ctx, "C", "error");
    notificationService.notify(ctx, "D", "success");

    expect(ctx.ui.notify).toHaveBeenCalledWith("ℹ️ A", "info");
    expect(ctx.ui.notify).toHaveBeenCalledWith("⚠️ B", "warning");
    expect(ctx.ui.notify).toHaveBeenCalledWith("❌ C", "error");
    expect(ctx.ui.notify).toHaveBeenCalledWith("✅ D", "info");
  });

  it("should handle empty message", () => {
    notificationService.notify(ctx, "", "info");
    expect(ctx.ui.notify).toHaveBeenCalledWith("ℹ️ ", "info");
  });

  it("should handle unicode in messages", () => {
    notificationService.notify(ctx, "你好世界 🌍", "info");
    expect(ctx.ui.notify).toHaveBeenCalledWith("ℹ️ 你好世界 🌍", "info");
  });
});