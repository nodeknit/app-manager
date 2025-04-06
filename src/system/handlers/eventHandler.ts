import { AbstractCollectionHandler, CollectionItem } from "../../lib/CollectionStorage";
import { AppManager } from "../../lib/AppManager";
import { AbstractEvent } from "../../lib/AsyncEventEmitter";

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
