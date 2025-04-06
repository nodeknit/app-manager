import { AbstractApp } from "../../../dist/lib/AbstractApp";
import { AppManager } from "../../../dist/lib/AppManager";
import { ExampleModel } from "./models/ExampleModel";
import ExampleController from "./controllers/ExampleController";
import { AbstractCollectionHandler } from "../../../dist/lib/CollectionStorage";
import { CollectionItem } from "../../../dist/lib/CollectionStorage";
import { ExampleSetting } from "./settings/exampleSetting";
declare class Resolver {
    name: string;
}
declare class ResolverHandler extends AbstractCollectionHandler {
    process(appManager: AppManager, data: CollectionItem[]): Promise<void>;
    unprocess(appManager: AppManager, data: CollectionItem[]): Promise<void>;
}
/**
 * Developer can decide which fields he needs to be appended to appManager by using decorator
 * */
export default class ExampleApp extends AbstractApp {
    appId: string;
    name: string;
    controllers: {
        route: string;
        controller: typeof ExampleController;
    }[];
    models: (typeof ExampleModel)[];
    settings: (typeof ExampleSetting)[];
    resolvers: (typeof Resolver)[];
    resolverHandler: ResolverHandler;
    constructor(appManager: AppManager);
    mount(): Promise<void>;
    unmount(): Promise<void>;
}
export {};
