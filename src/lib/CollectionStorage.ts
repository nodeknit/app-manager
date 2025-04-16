import {AppManager} from "./AppManager";

export interface CollectionItem {
  appId: string
  method?: 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'options' | 'trace' | 'connect' | 'all';
  item: any
}

export class CollectionStorage {
  public collections: Map<string, CollectionItem[]> = new Map();
  /** Only one unique handler for each collection */
  public collectionHandlers: Map<string, any> = new Map();
  public appManager: AppManager;

  constructor(appManager: AppManager) {
    this.appManager = appManager;
  }

  public async append(collectionName: string, data: CollectionItem[]): Promise<void> {
    // Mount handler if it exists
    let collectionHandler = this.collectionHandlers.get(collectionName);
    if (collectionHandler) {
      await collectionHandler.process(this.appManager, data);
    }

    this.collections.set(collectionName, (this.collections.get(collectionName) || []).concat(data));
  }

  public async remove(collectionName: string, appId: string): Promise<void> {
    const currentAppCollectionItems = this.collections.get(collectionName)?.filter(item => item.appId === appId);
    if (currentAppCollectionItems && currentAppCollectionItems.length > 0) {
      // Unmount handler if it exists (only for collection items connected to current app)
      let collectionHandler = this.collectionHandlers.get(collectionName);
      if (collectionHandler) {
        await collectionHandler.unprocess(this.appManager, currentAppCollectionItems);
      }

      // filter collection excluding elements connected to current app
      const allCollectionItems = this.collections.get(collectionName);
      this.collections.set(collectionName, allCollectionItems.filter(item => item.appId !== appId));
    }
  }
}


export abstract class AbstractCollectionHandler {
  public abstract process(appManager: AppManager, data: CollectionItem[]): Promise<void>;
  public abstract unprocess(appManager: AppManager, data: CollectionItem[]): Promise<void>;
}
