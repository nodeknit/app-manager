import {AbstractCollectionHandler, CollectionItem} from "../../lib/CollectionStorage";
import {AppManager} from "../../lib/AppManager";
import path from "path";
import express from "express";
import fs from "fs";

export class AssetHandler extends AbstractCollectionHandler {
  async process(appManager: AppManager, data: CollectionItem[]): Promise<void> {
    const appsPath = appManager.config.appsPath;

    data.forEach((item) => {
      const assetPath = path.resolve(`${appsPath}/${item.appId}/${item.item}`);
      const route = `/assets/${item.appId}`;

      if (!fs.existsSync(assetPath)) {
        AppManager.log.warn(`Assets folder not found for app ${item.appId}: ${assetPath}`);
        return;
      }

      const staticMiddleware = express.static(assetPath);
      appManager.app.use(route, staticMiddleware);
      AppManager.log.info(`Assets for app ${item.appId} added: ${route} → ${assetPath}`);
    });
  }

  async unprocess(appManager: AppManager, data: CollectionItem[]): Promise<void> {
    data.forEach((item) => {
      const route = `/assets/${item.appId}`;
      appManager.app._router.stack = appManager.app._router.stack.filter(
        (layer: any) => !(layer.route && layer.route.path === route)
      );
      AppManager.log.info(`Assets route removed for app ${item.appId}: ${route}`);
    });
  }

}

