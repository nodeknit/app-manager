import {AbstractCollectionHandler, CollectionItem} from "../../lib/CollectionStorage.js";
import {AppManager} from "../../lib/AppManager.js";
import {ISettingSlot} from "../../lib/SettingStorage.js";
import {Setting} from "../models/Setting.js";

export class SettingHandler extends AbstractCollectionHandler {
  async process(appManager: AppManager, data: CollectionItem[]): Promise<void> {
    // store setting slots in runtime and settings in database
    for (const { item, appId } of data) {
      try {
        const setting = new item() as ISettingSlot;

        if (!setting || typeof setting !== "object") {
          AppManager.log.warn(`Invalid setting format for appId ${appId}:`, item);
          continue;
        }

        if (!setting.key) {
          AppManager.log.warn(`Skipping setting without a key for appId ${appId}`);
          continue;
        }

        const settingSlot = appManager.settingStorage.getSettingSlot(setting.key);
        if (settingSlot) {
          AppManager.log.warn(`Duplicate setting key "${setting.key}" for appId ${appId}, skipping`);
          continue;
        }

        // use value from database, because it has higher priority than value from file
        const SettingModel = appManager.getModel(Setting);
        const settingFromDB = await SettingModel.findOne({
          where: { key: setting.key },
        });

        if (settingFromDB && settingFromDB.value !== undefined) {
          setting.value = settingFromDB.value;
        }

        // add setting in storage
        appManager.settingStorage.setSettingSlot(setting.key, setting);
        AppManager.log.info(`Setting ${setting.key} was set`)

      } catch (error) {
        AppManager.log.error(`Error processing setting for appId ${appId}:`, error);
      }
    }
  }

  async unprocess(appManager: AppManager, data: CollectionItem[]): Promise<void> {
    for (const { item } of data) {
      try {
        const setting = new item() as ISettingSlot;

        // delete setting from storage
        const settingSlot = appManager.settingStorage.getSettingSlot(setting.key);
        if (settingSlot) {
          appManager.settingStorage.deleteSettingSlot(setting.key);
        }

        AppManager.log.info(`Setting ${setting.key} was removed from storage`)

      } catch (error) {
        AppManager.log.error(`Error unprocessing setting:`, error);
      }
    }
  }

}
