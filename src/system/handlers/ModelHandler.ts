import { AbstractCollectionHandler, CollectionItem } from "../../lib/CollectionStorage";
import { AppManager } from "../../lib/AppManager";
import {Model, ModelCtor} from "sequelize-typescript";

export class ModelHandler extends AbstractCollectionHandler {
  async process(appManager: AppManager, data: CollectionItem[]): Promise<void> {
    let models: ModelCtor<Model>[] = [];
    data.forEach((item) => {
      if (!item.item) {
        AppManager.log.warn(`Skipping model due to missing model class:`, item);
        return;
      }

      if (appManager.sequelize.models[item.item.name]) {
        AppManager.log.info(`Model ${item.item.name} was not registered for app ${item.appId} because it already exists. Skipping.`);
        return;
      }

      models.push(item.item);
    });

    appManager.sequelize.addModels(models);

    if (process.env.NODE_ENV !== 'production') {
      await appManager.sequelize.sync({ force: true, alter: true });
    } else {
      // TODO use migrations in production
    }

    AppManager.log.info(`Models [${models.map(item => item.name).join(", ")}] have been registered.`);
  }

  async unprocess(appManager: AppManager, data: CollectionItem[]): Promise<void> {
    data.forEach((item) => {
      if (!item.item) {
        AppManager.log.warn(`Skipping unprocess due to missing model class:`, item);
        return;
      }

      if (appManager.sequelize.models[item.item.name]) {
        delete appManager.sequelize.models[item.item.name];
        AppManager.log.info(`Model ${item.item.name} has been unregistered.`);
      } else {
        AppManager.log.warn(`Model ${item.item.name} does not exist. Skipping.`);
      }
    });
  }
}
