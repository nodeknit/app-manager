import {AbstractCollectionHandler, CollectionItem} from "../../lib/CollectionStorage";
import {AppManager} from "../../lib/AppManager";

export class MiddlewareHandler extends AbstractCollectionHandler {
  async process(appManager: AppManager, data: CollectionItem[]): Promise<void> {
    data.forEach((item) => {
      const middleware = item.item as MiddlewareType;

      if (typeof middleware !== "function") {
        AppManager.log.warn(`Invalid middleware format for app ${item.appId}:`, item);
        return;
      }

      appManager.app.use(middleware);
      AppManager.log.info(`Added middleware for app ${item.appId}`);
    });
  }

  async unprocess(appManager: AppManager, data: CollectionItem[]): Promise<void> {
    data.forEach((item) => {
      const middleware = item.item as MiddlewareType;
      appManager.app._router.stack = appManager.app._router.stack.filter(
        (layer: any) => !(layer.handle && layer.handle === middleware)
      );
      AppManager.log.info(`Middleware removed for app ${item.appId}`);
    });
  }
}
