import { beforeEach, describe, expect, it, vi } from "bun:test";
import { InternalBus } from "../src/core/internal-bus";

describe("Core Service: InternalBus", () => {
  let bus: InternalBus;

  beforeEach(() => {
    bus = new InternalBus();
  });

  describe("on() - subscribe", () => {
    it("should register a listener for a new event type", () => {
      const handler = vi.fn();
      const unsubscribe = bus.on("test_event", handler);
      
      expect(typeof unsubscribe).toBe("function");
    });

    it("should allow subscribing multiple handlers to the same event type", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      bus.on("test_event", handler1);
      bus.on("test_event", handler2);
      
      bus.emit("test_event", "payload");
      
      expect(handler1).toHaveBeenCalledWith("payload");
      expect(handler2).toHaveBeenCalledWith("payload");
    });

    it("should allow subscribing to multiple different event types", () => {
      const handlerA = vi.fn();
      const handlerB = vi.fn();
      bus.on("event_a", handlerA);
      bus.on("event_b", handlerB);
      
      bus.emit("event_a", "payload_a");
      bus.emit("event_b", "payload_b");
      
      expect(handlerA).toHaveBeenCalledWith("payload_a");
      expect(handlerB).toHaveBeenCalledWith("payload_b");
    });
  });

  describe("emit()", () => {
    it("should call all handlers registered for the event type", async () => {
      const handler = vi.fn();
      bus.on("test_event", handler);
      
      await bus.emit("test_event", { data: "test" });
      
      expect(handler).toHaveBeenCalledWith({ data: "test" });
    });

    it("should handle async handlers", async () => {
      const asyncHandler = vi.fn().mockImplementation(async () => {
        await new Promise(r => setTimeout(r, 10));
      });
      bus.on("async_event", asyncHandler);
      
      await bus.emit("async_event", {});
      
      expect(asyncHandler).toHaveBeenCalled();
    });

    it("should handle sync handlers without returning a promise", async () => {
      const syncHandler = vi.fn();
      bus.on("sync_event", syncHandler);
      
      const result = await bus.emit("sync_event", "data");
      
      expect(syncHandler).toHaveBeenCalledWith("data");
      expect(result).toBeUndefined();
    });

    it("should not throw when emitting an unregistered event", async () => {
      await expect(bus.emit("nonexistent_event", {})).resolves.toBeUndefined();
    });

    it("should handle emitting with no listeners registered", async () => {
      // This is the same as unregistered - should not throw
      await expect(bus.emit("empty_event", {})).resolves.toBeUndefined();
    });

    it("should handle multiple handlers on same event type", async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      bus.on("multi", handler1);
      bus.on("multi", handler2);
      
      await bus.emit("multi", "data");
      
      expect(handler1).toHaveBeenCalledWith("data");
      expect(handler2).toHaveBeenCalledWith("data");
    });

    it("should pass typed payloads correctly", async () => {
      interface TestPayload { id: number; name: string }
      const handler = vi.fn();
      bus.on<TestPayload>("typed_event", handler);
      
      const payload: TestPayload = { id: 1, name: "test" };
      await bus.emit("typed_event", payload);
      
      expect(handler).toHaveBeenCalledWith(payload);
    });
  });

  describe("unsubscribe", () => {
    it("should return a function that removes the listener", async () => {
      const handler = vi.fn();
      const unsubscribe = bus.on("remove_event", handler);
      
      unsubscribe();
      await bus.emit("remove_event", {});
      
      expect(handler).not.toHaveBeenCalled();
    });

    it("should allow multiple handlers to coexist", async () => {
      const handlerA = vi.fn();
      const handlerB = vi.fn();
      const handlerC = vi.fn();
      
      bus.on("coexist", handlerA);
      bus.on("coexist", handlerB);
      bus.on("coexist", handlerC);
      
      await bus.emit("coexist", "data");
      
      expect(handlerA).toHaveBeenCalledWith("data");
      expect(handlerB).toHaveBeenCalledWith("data");
      expect(handlerC).toHaveBeenCalledWith("data");
      
      // Remove handlerB
      const unsubB = bus.on("coexist", handlerB);
      unsubB();
      await bus.emit("coexist", "data2");
      
      // handlerA and handlerC should still be called
      expect(handlerA).toHaveBeenCalledTimes(2);
      expect(handlerB).toHaveBeenCalledTimes(1); // only called once (before unsubscribe)
      expect(handlerC).toHaveBeenCalledTimes(2);
    });

    it("should be safe to call unsubscribe multiple times", () => {
      const handler = vi.fn();
      const unsub = bus.on("double_remove", handler);
      
      unsub();
      unsub(); // second call should be no-op
      
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle emitting with null payload", async () => {
      const handler = vi.fn();
      bus.on("null_event", handler);
      
      await bus.emit("null_event", null);
      
      expect(handler).toHaveBeenCalledWith(null);
    });

    it("should handle emitting with undefined payload", async () => {
      const handler = vi.fn();
      bus.on("undefined_event", handler);
      
      await bus.emit("undefined_event", undefined);
      
      expect(handler).toHaveBeenCalledWith(undefined);
    });

    it("should handle emitting with empty object payload", async () => {
      const handler = vi.fn();
      bus.on("empty_event", handler);
      
      await bus.emit("empty_event", {});
      
      expect(handler).toHaveBeenCalledWith({});
    });

    it("should handle empty string event type", async () => {
      const handler = vi.fn();
      bus.on("", handler);
      
      await bus.emit("", {});
      
      expect(handler).toHaveBeenCalled();
    });
  });
});