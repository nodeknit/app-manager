import { AbstractCollectionHandler, CollectionItem } from "../../lib/CollectionStorage.js";
import { AppManager } from "../../lib/AppManager.js";
import { IController } from "../../lib/AbstractApp.js";

export class ControllerHandler extends AbstractCollectionHandler {
  async process(appManager: AppManager, data: CollectionItem[]): Promise<void> {
    data.forEach((item) => {
      const { route, controller, method } = item.item as IController;
      console.log(">>>", item)
      if (!route || typeof controller !== "function") {
        AppManager.log.warn(`Invalid controller format for app ${item.appId}:`, item);
        return;
      }

      const httpMethod = (method || 'all').toLowerCase();
      if (typeof (appManager.app as any)[httpMethod] === 'function') {
        (appManager.app as any)[httpMethod](route, controller);
        AppManager.log.info(`Controller mounted for app ${item.appId}: [${httpMethod.toUpperCase()}] ${route}`);
      } else {
        AppManager.log.warn(`Invalid HTTP method "${method}" for app ${item.appId}:`, item);
      }
    });
  }

  async unprocess(appManager: AppManager, data: CollectionItem[]): Promise<void> {
    data.forEach((item) => {
      const { route, method } = item.item as IController;
      if (!route) return;

      const httpMethod = (method || 'all').toLowerCase();

      appManager.app._router.stack = appManager.app._router.stack.filter(
        (layer: any) => {
          const matchesRoute = layer.route && layer.route.path === route;
          const matchesMethod = httpMethod === 'all' || (layer.route && layer.route.methods && layer.route.methods[httpMethod]);
          return !(matchesRoute && matchesMethod);
        }
      );

      AppManager.log.info(`Controller removed for app ${item.appId}: [${httpMethod.toUpperCase()}] ${route}`);
    });
  }
}
