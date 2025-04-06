import { AbstractCollectionHandler, CollectionItem } from "../../lib/CollectionStorage.js";
import { AppManager } from "../../lib/AppManager.js";
import { AbstractEvent } from "../../lib/AsyncEventEmitter.js";

export class EventHandler extends AbstractCollectionHandler {
  async process(appManager: AppManager, data: CollectionItem[]): Promise<void> {
    data.forEach((item) => {
      const EventClass = item.item as { new (): AbstractEvent };
      const eventInstance = new EventClass();
      appManager.emitter.events.set(eventInstance.key, eventInstance);
    });
  }

  async unprocess(appManager: AppManager, data: CollectionItem[]): Promise<void> {
    data.forEach((item) => {
      const EventClass = item.item as { new (): AbstractEvent };
      const eventInstance = new EventClass();
      appManager.emitter.events.delete(eventInstance.key);
    });
  }
}
