import { AbstractCollectionHandler, CollectionItem } from "../../lib/CollectionStorage.js";
import { AppManager } from "../../lib/AppManager.js";
import {IController} from "../../lib/AbstractApp";

export class ControllerHandler extends AbstractCollectionHandler {
  async process(appManager: AppManager, data: CollectionItem[]): Promise<void> {
    data.forEach((item) => {
      const { route, controller } = item.item as IController;

      if (!route || typeof controller !== "function") {
        AppManager.log.warn(`Invalid controller format for app ${item.appId}:`, item);
        return;
      }

      appManager.app.all(route, controller);
      AppManager.log.info(`Controller mounted for app ${item.appId}: ${route}`);
    });
  }

  async unprocess(appManager: AppManager, data: CollectionItem[]): Promise<void> {
    data.forEach((item) => {
      const { route } = item.item as IController;
      if (!route) return;

      appManager.app._router.stack = appManager.app._router.stack.filter(
        (layer: any) => !(layer.route && layer.route.path === route)
      );
      AppManager.log.info(`Controller removed for app ${item.appId}: ${route}`);
    });
  }
}
