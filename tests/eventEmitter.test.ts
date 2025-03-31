import { describe, it, expect, vi } from "vitest";
import { AsyncEventEmitter } from "../src/lib/AsyncEventEmitter";
import { AbstractEvent } from "../src/lib/AsyncEventEmitter";

class TestEvent extends AbstractEvent {
  key = "testEvent";
  arguments: [string, boolean] = ["message", true];
  description: string;
  name: string;
}

describe("AsyncEventEmitter", () => {
  it("should call emitSync correctly", () => {
    const emitter = new AsyncEventEmitter();
    const listener = vi.fn();

    emitter.events.set("testEvent", new TestEvent());
    emitter.subscribe(TestEvent, "testListener", listener);

    emitter.emitSync(TestEvent, "Hello", true);

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith("Hello", true);
  });

  it("should call emitAsync correctly", async () => {
    const emitter = new AsyncEventEmitter();
    const listener = vi.fn(async (msg) => msg);

    emitter.events.set("testEvent", new TestEvent());
    emitter.subscribe(TestEvent, "testListener", listener);

    await emitter.emitAsync(TestEvent, "Async message", true, 500);

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith("Async message", true);
  });

  it("should reject emitAsync by timeout", async () => {
    const emitter = new AsyncEventEmitter();
    const listener = vi.fn(async (): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    });

    emitter.events.set("testEvent", new TestEvent());
    emitter.subscribe(TestEvent, "testListener", listener);

    await expect(emitter.emitAsync(TestEvent, "Slow message", true, 100))
      .rejects.toThrow('Timeout exceeded for event "testEvent"');

    expect(listener).toHaveBeenCalledOnce();
  });

  it("should add and delete listeners correctly", () => {
    const emitter = new AsyncEventEmitter();
    const listener = vi.fn();

    emitter.events.set("testEvent", new TestEvent());

    emitter.subscribe(TestEvent, "testListener", listener);
    emitter.emitSync(TestEvent, "Subscribed", true);

    expect(listener).toHaveBeenCalledOnce();

    emitter.unsubscribe(TestEvent, "testListener");
    emitter.emitSync(TestEvent, "Unsubscribed", true);

    expect(listener).toHaveBeenCalledOnce(); // should remain 1 listener
  });
});
