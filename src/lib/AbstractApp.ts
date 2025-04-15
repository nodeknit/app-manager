import {AppManager} from "./AppManager";
import {AbstractCollectionHandler} from "./CollectionStorage";
import {ISettingSlot} from "./SettingStorage";
import {AbstractEvent} from "./AsyncEventEmitter";

export interface IController {
  route: string
  controller: (req: ReqType, res: ResType) => void
}

interface ISettingConstructor {
  new (name: string): ISettingSlot;
}

interface IEventConstructor {
  new (name: string): AbstractEvent;
}

export abstract class AbstractApp {
  public abstract appId: string;
  public abstract name: string;
  public models: any[];
  public controllers: IController[];
  public settings: ISettingConstructor[];
  public assets: string[];
  public events: IEventConstructor[];
  public middlewares: MiddlewareType[];
  public installSteps: any[];
  [key: string]: any; // for custom fields that user can add

  public appManager: AppManager;

  constructor(appManager: AppManager) {
    this.appManager = appManager;
  }

  /** Method for mounting the app and starting it completely prepared for work */
  abstract mount(): Promise<void>
  /** Method for unmounting the app and stopping it completely */
  abstract unmount(): Promise<void>

  public async _mount() {
    // Register collection handlers
    const collectionHandlers = Reflect.getMetadata("collectionHandlers", this.constructor.prototype) || [];
    for (const { collectionName, propertyKey } of collectionHandlers) {
      const handler = this[propertyKey] as AbstractCollectionHandler;
      if (handler) {
        this.appManager.collectionStorage.collectionHandlers.set(collectionName, handler);

        /** Process current collection with just added handler (if it exists)
         *
         * Explanation: Some modules may have collections, while the handlers for these collections
         * can be provided by other modules (and vice versa).
         * Therefore, when adding a handler to an existing collection, it is necessary to process
         * the collection that was added previously with this handler.
         * In the opposite direction, everything works automatically: if a new collection is added
         * for handler that was already registered earlier, it will be handled in the `append` method
         * of the collection storage.
         */
        const handlerCollection = this.appManager.collectionStorage.collections.has(collectionName);
        if (handlerCollection) {
          const currentCollectionItems = this.appManager.collectionStorage.collections.get(collectionName);
          await handler.process(this.appManager, currentCollectionItems);
        }
      }
    }

    // Register collections
    const allCollections = Reflect.getMetadataKeys(this.constructor.prototype);
    for (const collection of allCollections) {
      const properties = Reflect.getMetadata(collection, this.constructor.prototype) || [];

      for (const property of properties) {
        if (!this[property]) continue;

        const value = this[property].map((item: any) => ({
          appId: this.appId,
          item,
        }));

        // assign appManager to fields marked with @AssignAppManager decorator
        for (let element of value) {
          // Reflect.getMetadata needs target to be an object
          if (typeof element.item !== "object" && typeof element.item !== "function") {
            continue;
          }

          const fields: string[] = Reflect.getMetadata("assignAppManagerFields", element.item) || [];
          for (const field of fields) {
            if (Object.prototype.hasOwnProperty.call(element.item, field)) {
              element.item[field] = this.appManager;
            }
          }
        }

        await this.appManager.collectionStorage.append(collection, value);
      }
    }

    await this.mount();
  }

  public async _unmount() {
    // Remove collections
    const allCollections = Reflect.getMetadataKeys(this.constructor.prototype);
    for (const collection of allCollections) {
      const properties = Reflect.getMetadata(collection, this.constructor.prototype) || [];

      for (const property of properties) {
        if (!this[property]) continue;

        await this.appManager.collectionStorage.remove(collection, this.appId);
      }
    }

    // Remove collection handlers
    const collectionHandlers = Reflect.getMetadata("collectionHandlers", this.constructor.prototype) || [];
    for (const { collectionName, propertyKey } of collectionHandlers) {
      const handler = this[propertyKey] as AbstractCollectionHandler;
      if (handler) {
        // TODO problem is when handler and collection is from one app, because we unprocess collection we wanna delete
        //  and then unprocessing all collections when deleting the handler (including collection we unprocessed earlier)
        // before deleting, handler should unprocess all collection items
        const allCollectionItems = this.appManager.collectionStorage.collections.get(collectionName);
        await handler.unprocess(this.appManager, allCollectionItems);
        this.appManager.collectionStorage.collectionHandlers.delete(collectionName);
      }
    }

    await this.unmount();
  }
}
