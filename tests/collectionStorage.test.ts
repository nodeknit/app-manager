import {AbstractCollectionHandler, CollectionItem, CollectionStorage} from "../src/lib/CollectionStorage";
import { AbstractApp } from "../src/lib/AbstractApp";
import { Collection, CollectionHandler } from "../src/lib/decorators/appUtils";
import {AppManager} from "../src/lib/AppManager";
import { describe, it, expect, beforeEach } from "vitest";

class ExampleApp extends AbstractApp {
  appId = "example";
  name = "Example";

  @Collection
  strings = ["hello", "world"];

  constructor(appManager: AppManager) {
    super(appManager);
  }

  async mount() {
    console.log("ExampleApp mounted");
  }

  async unmount() {
    console.log("ExampleApp unmounted");
  }
}

class StringModifierHandler extends AbstractCollectionHandler {
  async process(appManager: AppManager, data: CollectionItem[]) {
    data.forEach(item => (item.item = item.item.toUpperCase()));
  }

  async unprocess(appManager: AppManager, data: CollectionItem[]) {
    data.forEach(item => (item.item = item.item.toLowerCase()));
  }
}

class HandlerApp extends AbstractApp {
  appId = "handler";
  name = "Handler";

  @CollectionHandler("strings")
  stringHandler = new StringModifierHandler;

  constructor(appManager: AppManager) {
    super(appManager);
  }

  async mount() {
    console.log("HandlerApp mounted");
  }

  async unmount() {
    console.log("HandlerApp unmounted");
  }
}

describe("Collection & Handler Integration", function () {
  let collectionStorage: CollectionStorage;
  let appManager: AppManager;
  let exampleApp: AbstractApp;
  let handlerApp: AbstractApp;

  beforeEach(async () => {
    collectionStorage = new CollectionStorage(appManager);
    appManager = { collectionStorage } as AppManager;

    exampleApp = new ExampleApp(appManager);
    handlerApp = new HandlerApp(appManager);

    await exampleApp._mount();
    await handlerApp._mount();
  });

  it("should register collection and handler correctly", function () {
    expect(collectionStorage.collections.has("strings")).to.be.true;
    expect(collectionStorage.collectionHandlers.has("strings")).to.be.true;

    const data = collectionStorage.collections.get("strings");
    expect(data).to.deep.equal([{appId: "example", item: "HELLO"}, {appId: "example", item: "WORLD"}]);
  });

  it("should remove handler when handler app is unmounted and unprocess processed data", async function () {
    await handlerApp._unmount();
    expect(collectionStorage.collectionHandlers.has("strings")).to.be.false;

    const data = collectionStorage.collections.get("strings");
    expect(data).to.deep.equal([{appId: "example", item: "hello"}, {appId: "example", item: "world"}]);
  });

  it("should re-register handler after re-mounting handler app and process necessary data", async function () {
    await handlerApp._unmount();
    await handlerApp._mount();
    expect(collectionStorage.collectionHandlers.has("strings")).to.be.true;

    const data = collectionStorage.collections.get("strings");
    expect(data).to.deep.equal([{appId: "example", item: "HELLO"}, {appId: "example", item: "WORLD"}]);
  });

  it("should not remove collection when collection app is unmounted, only delete its data from here", async function () {
    await exampleApp._unmount();
    expect(collectionStorage.collections.has("strings")).to.be.true;

    const collectionData = collectionStorage.collections.get("strings") ?? [];
    expect(collectionData.some(item => item.appId === exampleApp.appId)).to.be.false;
  });
});

