import { describe, it, beforeEach, expect, vi } from "vitest";
import express, {Express} from "express";
import fs from "fs";
import { AppManager } from "../src/lib/AppManager";
import { AssetHandler } from "../src/system/handlers/AssetHandler";
import { ControllerHandler } from "../src/system/handlers/ControllerHandler";
import { MiddlewareHandler } from "../src/system/handlers/MiddlewareHandler";
import { ModelHandler } from "../src/system/handlers/ModelHandler";
import { SettingHandler } from "../src/system/handlers/SettingHandler";
import {SettingStorage} from "../src/lib/SettingStorage";

process.env.NODE_ENV = 'production'

vi.mock("fs");

let appManager: AppManager;
let mockApp: Express;

beforeEach(() => {
  mockApp = express();
  appManager = {
    app: mockApp,
    config: {appsPath: "/test/apps"},
    settingStorage: new SettingStorage(),
    sequelize: {models: {}, addModels: vi.fn()},
    getModel: vi.fn().mockReturnValue({ findOne: vi.fn().mockResolvedValue(null) })
  } as unknown as AppManager;
});

describe("AssetHandler", () => {
  it("should register asset routes if the folder exists", async () => {
    // @ts-ignore
    fs.existsSync.mockReturnValue(true);
    const useSpy = vi.spyOn(mockApp, "use");

    const handler = new AssetHandler();
    await handler.process(appManager, [{ appId: "testApp", item: "/assets" }]);

    expect(useSpy).toHaveBeenCalledWith("/assets/testApp", expect.any(Function));
  });

  it("should not register asset routes if the folder does not exist", async () => {
    // @ts-ignore
    fs.existsSync.mockReturnValue(false);
    const useSpy = vi.spyOn(mockApp, "use");

    const handler = new AssetHandler();
    await handler.process(appManager, [{ appId: "testApp", item: "/assets" }]);

    expect(useSpy).not.toHaveBeenCalled();
  });

  it("should remove asset routes on unprocess", async () => {
    // @ts-ignore
    fs.existsSync.mockReturnValue(true);
    const handler = new AssetHandler();
    await handler.process(appManager, [{ appId: "testApp", item: "/assets" }]);
    await handler.unprocess(appManager, [{ appId: "testApp", item: "/assets" }]);

    expect(mockApp._router.stack.some((layer: any) => layer.route?.path === "/assets/testApp")).toBe(false);
  });
});

describe("ControllerHandler", () => {
  it("should register controller on a route", async () => {
    const controllerMock = vi.fn(async (req, res, next) => next());
    const allSpy = vi.spyOn(mockApp, "all"); // <-- здесь меняем на all

    const handler = new ControllerHandler();
    await handler.process(appManager, [{ appId: "testApp", item: { route: "/api", controller: controllerMock } }]);

    expect(allSpy).toHaveBeenCalledWith("/api", controllerMock); // <-- здесь тоже меняем
  });

  it("should remove controller on unprocess", async () => {
    const controllerMock = vi.fn(async (req, res, next) => next());
    const handler = new ControllerHandler();
    await handler.process(appManager, [{ appId: "testApp", item: { route: "/api", controller: controllerMock } }]);
    await handler.unprocess(appManager, [{ appId: "testApp", item: { route: "/api", controller: controllerMock } }]);

    expect(mockApp._router.stack.some((layer: any) => layer.route?.path === "/api")).toBe(false);
  });
});

describe("MiddlewareHandler", () => {
  it("should register middleware", async () => {
    const middlewareMock = vi.fn((req, res, next) => next());
    const useSpy = vi.spyOn(mockApp, "use");

    const handler = new MiddlewareHandler();
    await handler.process(appManager, [{ appId: "testApp", item: middlewareMock }]);

    expect(useSpy).toHaveBeenCalledWith(middlewareMock);
  });

  it("should remove middleware on unprocess", async () => {
    const middlewareMock = vi.fn((req, res, next) => next());
    const handler = new MiddlewareHandler();
    await handler.process(appManager, [{ appId: "testApp", item: middlewareMock }]);
    await handler.unprocess(appManager, [{ appId: "testApp", item: middlewareMock }]);

    expect(mockApp._router.stack.some((layer: any) => layer.handle === middlewareMock)).toBe(false);
  });
});

describe("ModelHandler", () => {
  it("should register models if not already present", async () => {
    const mockModel = { name: "TestModel" };
    const handler = new ModelHandler();
    await handler.process(appManager, [{ appId: "testApp", item: mockModel }]);

    expect(appManager.sequelize.addModels).toHaveBeenCalledWith([mockModel]);
  });

  it("should unregister models", async () => {
    const mockModel = { name: "TestModel" };
    // @ts-ignore
    appManager.sequelize.models["TestModel"] = mockModel;

    const handler = new ModelHandler();
    await handler.unprocess(appManager, [{ appId: "testApp", item: mockModel }]);

    expect(appManager.sequelize.models["TestModel"]).toBeUndefined();
  });
});

describe("SettingHandler", () => {
  it("should add a setting to storage", async () => {
    class TestSetting {
      key = "TEST_SETTING";
      type = "string";
    }

    const handler = new SettingHandler();
    await handler.process(appManager, [{ appId: "testApp", item: TestSetting }]);

    const settingSlot = appManager.settingStorage.getSettingSlot("TEST_SETTING");
    expect(settingSlot).toBeDefined();
    expect(settingSlot?.key).toBe("TEST_SETTING");
    expect(settingSlot?.value).toBeUndefined();
  });

  it("should remove a setting from storage", async () => {
    class TestSetting {
      key = "TEST_SETTING";
      type: "string" = "string";
    }

    appManager.settingStorage.setSettingSlot("TEST_SETTING", new TestSetting());

    const handler = new SettingHandler();
    await handler.unprocess(appManager, [{ appId: "testApp", item: TestSetting }]);

    const settingSlot = appManager.settingStorage.getSettingSlot("TEST_SETTING");
    expect(settingSlot).toBeUndefined();
  });
});

