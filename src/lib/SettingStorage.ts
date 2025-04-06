import Ajv from 'ajv';
import {AppManager} from "./AppManager";
import {AllowUnsafeSettings} from "../system/settings/allowUnsafeSettings";

export interface ISettingSlot {
  key: string
  value?: any
  name?: string
  description?: string
  tooltip?: string
  type: 'string' | 'boolean' | 'json' | 'number'
  jsonSchema?: any
  uiSchema?: any
  readOnly?: boolean
  appId?: string
  isRequired?: boolean
}

export class SettingStorage {
  private settingSlots: Map<string, ISettingSlot> = new Map();

  public set(key: string, value: any): void {
    // works only for existing setting slots
    const settingSlot = this.getSettingSlot(key);
    if (!settingSlot) {
      AppManager.log.error(`Can not set value for setting that was not added to storage before`);
      return
    }

    // update value
    settingSlot.value = value;
    this.setSettingSlot(key, settingSlot);
  }

  public get<T extends ISettingSlot>(settingClass: new () => T): T["value"] {
    const settingInstance = new settingClass();

    // check that setting slot exists
    const settingSlot = this.getSettingSlot(settingInstance.key);
    if (!settingSlot) {
      AppManager.log.error(`Can not get value for setting ${settingInstance.key}. It should be registered in storage`);
      return undefined;
    }

    // ENV value is prioritized
    if (process.env[settingSlot.key] !== undefined) {

      let value;
      switch (settingSlot.type) {
        case "json":
          try {
            value = JSON.parse(process.env[settingSlot.key]);

            // if value was parsed, check that given json matches the schema (if !ALLOW_UNSAFE_SETTINGS)
            const ALLOW_UNSAFE_SETTINGS = this.get(AllowUnsafeSettings);
            if (settingSlot.jsonSchema && ALLOW_UNSAFE_SETTINGS !== true) {
              const ajv = new Ajv();
              const validate = ajv.compile(settingSlot.jsonSchema);
              if (!validate(value)) {
                AppManager.log.error(`AJV Validation Error: Value [${value}] from process.env for [${settingSlot.key}] does not match the schema`, validate.errors);
                return undefined;
              }
            }
          } catch (e) {
            AppManager.log.error(`Error trying to parse setting value from process.env: ${e}`);
            return undefined;
          }
          break;

        case "number":
          value = Number(process.env[settingSlot.key]);
          if (isNaN(value)) {
            console.warn(`Invalid number format for key "${settingSlot.key}":`, value);
            value = undefined;
          }
          break;

        case "boolean":
          value = process.env[settingSlot.key].toLowerCase() === "true";
          break;

        default:
          // for string case remains unchanged
          value = process.env[settingSlot.key];
      }

      return value;

    } else {
      return settingSlot.value;
    }

  }

  public getAppSettingSlots(appId: string): ISettingSlot[] {
    return Array.from(this.settingSlots.values()).filter(item => item.appId === appId);
  }

  public getSettingSlot(key: string): ISettingSlot {
    return this.settingSlots.get(key);
  }

  public deleteSettingSlot(key: string): void {
    this.settingSlots.delete(key);
  }

  public setSettingSlot(key: string, settingSlot: ISettingSlot): void {
    if (!settingSlot["key"] || settingSlot["key"] !== key) {
      AppManager.log.error(`Key [${key}] does not match with settingSlot.key: [${settingSlot.key}]`);
      return;
    }

    if (!settingSlot["type"]) {
      AppManager.log.error(`Could not set setting without a type`);
      return;
    }

    // TODO add value check (if given) to test that it fits the given type

    // TODO check hasUnfilledSettings every time after setting new setting

    // check that jsonSchema is present for a json type
    if (settingSlot.type === "json" && settingSlot.jsonSchema === undefined) {
      AppManager.log.error(`Setting set [${key}]: jsonSchema is missed for type "json"`);
      return;
    }

    // convert some values for boolean type
    if (settingSlot.type === "boolean") {
      if (["yes", "YES", "Yes", "1", "true", "TRUE", "True"].includes(`${settingSlot.value}`)) {
        settingSlot.value = true;
      } else if (["no", "NO", "No", "0", "false", "FALSE", "False"].includes(`${settingSlot.value}`)) {
        settingSlot.value = false;
      }
    }

    // check that value matches the schema for json type (if !ALLOW_UNSAFE_SETTINGS)
    if (settingSlot.type === "json" && settingSlot.jsonSchema) {
      const ALLOW_UNSAFE_SETTINGS = this.get(AllowUnsafeSettings);
      if (ALLOW_UNSAFE_SETTINGS !== true) {
        const ajv = new Ajv();

        let validate;
        try {
          validate = ajv.compile(settingSlot.jsonSchema);
        } catch (e) {
          AppManager.log.error(`AJV Validation Error: Can not compile the schema`, e);
          return;
        }

        if (settingSlot.value !== undefined && !validate(settingSlot.value)) {
          let errorMessage = `AJV Validation Error: [${key}] Value [${settingSlot.value}] does not match the schema, see logs for more info`;
          AppManager.log.error(errorMessage, JSON.stringify(validate.errors, null, 2));
          return;
        }
      }
    }

    // Set in storage
    this.settingSlots.set(key, settingSlot);
  }
}
