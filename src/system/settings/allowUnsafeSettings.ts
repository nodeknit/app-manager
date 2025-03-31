import {ISettingSlot} from "../../lib/SettingStorage";

export class AllowUnsafeSettings implements ISettingSlot {
  key: string = "ALLOW_UNSAFE_SETTINGS"
  type: "string" | "number" | "boolean" | "json" = "boolean"
  name: string = "Allow unsafe settings"
  description: string = "Allow unsafe settings skipping ajv check for json type"
  value: boolean = false;
}
