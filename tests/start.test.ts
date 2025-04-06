import { describe, it, beforeAll, expect } from "vitest";
import { Sequelize } from "sequelize-typescript";
import { App } from "../src/system/models/App.js";
import { Setting } from "../src/system/models/Setting.js";
import { AppManager } from "../src/lib/AppManager.js";
import getDefaultConfig from "../src/system/defaults.js";
import SystemApp from "../src/system/SystemApp.js";
import {AllowUnsafeSettings} from "../src/system/settings/allowUnsafeSettings";

type TestRuntimeApp = {
  package: {
    appId: string;
    appDependencies?: { [key: string]: string };
  };
  enable: boolean;
};

let sequelize: Sequelize;
let appManager: AppManager;
let systemApp: SystemApp;

beforeAll(async () => {
  sequelize = new Sequelize('sqlite::memory:');

  await sequelize.authenticate();
  await sequelize.sync({ force: true });

  appManager = new AppManager(sequelize);
  const defaultConfig = getDefaultConfig();
  await appManager.init(defaultConfig);

  systemApp = new SystemApp(appManager);
  await systemApp._mount();
});

describe("AppManager Initialization", () => {
  it("should have 'models' collection and handler", () => {
    const collectionStorage = appManager.collectionStorage;
    expect(collectionStorage.collections.has("models")).toBe(true);
    expect(collectionStorage.collectionHandlers.has("models")).toBe(true);
  });

  it("should have App and Setting models in sequelize", () => {
    expect(sequelize.models.App).toBeDefined();
    expect(sequelize.models.Setting).toBeDefined();
  });

  it("should have 'ALLOW_UNSAFE_SETTINGS' in setting storage and it should be false", () => {
    const settingValue = appManager.settingStorage.get(AllowUnsafeSettings);
    expect(settingValue).toBeDefined();
    expect(settingValue).toBe(false);
  });
});

describe("Setting afterCreate/afterUpdate methods", () => {
  it("should change value in storage after creating/updating record in db", async () => {
    const settingStorage = appManager.settingStorage;
    expect(settingStorage.get(AllowUnsafeSettings)).toBe(false); // should be false by default

    // creating record in db with true value (there is no one yet)
    const SettingModel = appManager.getModel(Setting);
    await SettingModel.create({ key: "ALLOW_UNSAFE_SETTINGS", value: true });
    expect(settingStorage.get(AllowUnsafeSettings)).toBe(true); // should be changed to true

    // updating record in db with false value
    await SettingModel.update({ value: false }, { where: { key: "ALLOW_UNSAFE_SETTINGS" }, individualHooks: true });
    expect(settingStorage.get(AllowUnsafeSettings)).toBe(false); // should be changed back to false
  })
})

describe("Create proper queue to mount", () => {
  it("should load apps in the correct order based on dependencies", async () => {
    const mockApps: { [key: string]: TestRuntimeApp } = {
      A: { package: { appId: "A" }, enable: true },
      B: { package: { appId: "B", appDependencies: { A: "^1.0.0" } }, enable: true },
      C: { package: { appId: "C", appDependencies: { B: "^1.0.0" } }, enable: true },
    };

    const result: TestRuntimeApp[] = systemApp.getAppQueueToMount.call({ appManager: { appStorage: { getApps: () => mockApps } } });
    expect(result.map(app => app.package.appId)).toEqual(["A", "B", "C"]);
  });

  it("should not include apps that are disabled", async () => {
    const mockApps: { [key: string]: TestRuntimeApp } = {
      A: { package: { appId: "A" }, enable: false },
      B: { package: { appId: "B", appDependencies: { A: "^1.0.0" } }, enable: true },
    };

    const result: TestRuntimeApp[] = systemApp.getAppQueueToMount.call({ appManager: { appStorage: { getApps: () => mockApps } } });
    expect(result.length).toBe(0);
  });

  it("should not include apps with missing dependencies", async () => {
    const mockApps: { [key: string]: TestRuntimeApp } = {
      B: { package: { appId: "B", appDependencies: { A: "^1.0.0" } }, enable: true },
    };

    const result: TestRuntimeApp[] = systemApp.getAppQueueToMount.call({ appManager: { appStorage: { getApps: () => mockApps } } });
    expect(result.length).toBe(0);
  });

  it("should throw an error for circular dependencies", () => {
    const mockApps: { [key: string]: TestRuntimeApp } = {
      A: { package: { appId: "A", appDependencies: { C: "^1.0.0" } }, enable: true },
      B: { package: { appId: "B", appDependencies: { A: "^1.0.0" } }, enable: true },
      C: { package: { appId: "C", appDependencies: { B: "^1.0.0" } }, enable: true },
    };

    expect(() => systemApp.getAppQueueToMount.call({
      appManager: { appStorage: { getApps: () => mockApps } }
    })).toThrow("Circular dependency detected trying to create app queue. External maintenance required");
  });
});
