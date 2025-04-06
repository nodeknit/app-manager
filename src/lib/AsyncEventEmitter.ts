import {AppManager} from "./AppManager";
import { EventEmitter } from 'events';


export abstract class AbstractEvent {
  abstract key: string;
  abstract arguments: any[];

  /** For visual programming */
  abstract name: string;
  abstract description: string;
}


export class AsyncEventEmitter extends EventEmitter {
  /** Stores events by key */
  public events: Map<string, AbstractEvent> = new Map();

  /** Stores listeners by key */
  private listenersMap: Map<string, (...args: any[]) => void> = new Map();

  emitSync<T extends AbstractEvent>(Event: new () => T, ...args: T['arguments']): void {
    const eventInstance = new Event();
    const storedEvent = this.events.get(eventInstance.key);

    /** Storage is used to be sure that event was registered */
    if (!storedEvent) {
      AppManager.log.error(`Event "${eventInstance.key}" was not found in emitter`);
      return;
    }

    const listeners = this.listeners(eventInstance.key);
    if (listeners.length === 0) {
      return;
    }

    listeners.forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        AppManager.log.error(`Error in sync listener for "${eventInstance.key}":`, error);
      }
    });
  }

  /** Asynchronous emit with timeout (required last argument) */
  async emitAsync<T extends AbstractEvent>(Event: new () => T, ...args: [...T['arguments'], number]): Promise<void> {
    // Extract the timeout value from the arguments list
    let timeout = args.pop();

    const eventInstance = new Event();
    const storedEvent = this.events.get(eventInstance.key);

    /** Storage is used to be sure that event was registered */
    if (!storedEvent) {
      AppManager.log.warn(`Event "${eventInstance.key}" was not found in emitter`);
      return;
    }

    const listeners = this.listeners(eventInstance.key);
    if (listeners.length === 0) {
      return;
    }

    let timeoutId: NodeJS.Timeout;

    // Create a timeout promise that rejects if the event execution exceeds the given time limit
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        AppManager.log.error(`Timeout exceeded for event "${eventInstance.key}"`);
        reject(new Error(`Timeout exceeded for event "${eventInstance.key}"`));
      }, timeout);
    });

    try {
      // Run all listeners concurrently and race them against the timeout promise
      await Promise.race([
        Promise.all(
          listeners.map(listener =>
            (async () => {
              try {
                // Execute the listener function with the provided arguments
                await listener(...args);
              } catch (error) {
                // Log any errors that occur inside the listener
                AppManager.log.error(`Error in listener for "${eventInstance.key}":`, error);
                throw error;
              }
            })()
          )
        ),
        timeoutPromise, // Rejects the entire operation if the timeout is exceeded
      ]);
    } finally {
      // Ensure that the timeout is cleared after execution
      clearTimeout(timeoutId);
    }
  }

  /** Subscribe with a listener key to store it in emitter */
  subscribe<T extends AbstractEvent>(
    Event: new () => T,
    listenerKey: string,
    listener: (...args: [...T['arguments'], number]) => Promise<void>
  ): void {
    const eventInstance = new Event();
    const storedEvent = this.events.get(eventInstance.key);

    if (!storedEvent) {
      AppManager.log.error(`Event "${eventInstance.key}" was not found in emitter`);
      return;
    }

    this.on(eventInstance.key, listener);
    this.listenersMap.set(listenerKey, listener);
  }

  /** Unsubscribe with the listener key */
  unsubscribe<T extends AbstractEvent>(Event: new () => T, listenerKey: string): void {
    const eventInstance = new Event();
    const storedEvent = this.events.get(eventInstance.key);

    if (!storedEvent) {
      AppManager.log.error(`Event "${eventInstance.key}" was not found in emitter`);
      return;
    }

    const listener = this.listenersMap.get(listenerKey);
    if (!listener) {
      AppManager.log.error(`Listener with key "${listenerKey}" was not found in emitter`);
      return;
    }

    this.off(eventInstance.key, listener);
    this.listenersMap.delete(listenerKey);
  }

  /** Retrieve all stored events */
  getAllEvents(): Record<string, AbstractEvent> {
    return Object.fromEntries(this.events.entries());
  }
}
