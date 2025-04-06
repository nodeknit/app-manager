import {
  Table,
  Column,
  Model,
  DataType,
  AfterCreate,
  AfterUpdate,
  BeforeUpdate,
  BeforeCreate,
} from 'sequelize-typescript';
import { InferAttributes, InferCreationAttributes } from 'sequelize';
import {AppManager} from "../../lib/AppManager";
import {AssignAppManager} from "../../lib/decorators/appUtils";

@Table({ tableName: 'settings', timestamps: false })
export class Setting extends Model<InferAttributes<Setting>, InferCreationAttributes<Setting>> {
  @AssignAppManager
  static appManager: AppManager;

  @Column({ type: DataType.STRING, allowNull: false, unique: true, primaryKey: true })
  declare key: string;

  @Column(DataType.JSON)
  declare value?: any;

  /** To call update hooks, we should use {individualHooks: true} in query,
   *  or apply update() method to record of model, not to model itself */

  @BeforeCreate
  @BeforeUpdate
  static beforeSaveHook(instance: Setting, options: any): void {
    const settingSlot = this.appManager.settingStorage.getSettingSlot(instance.key);
    if (!settingSlot) {
      throw new Error(`Setting key '${instance.key}' does not exist in storage.`);
    }

    AppManager.log.info(`Setting saved in database: ${instance.key}: ${instance.value}`);
  }

  @AfterCreate
  @AfterUpdate
  static afterSaveHook(instance: Setting, options: any): void {
    // update value in setting storage
    if (instance.value !== undefined) {
      this.appManager.settingStorage.set(instance.key, instance.value);
    }
  }
}
