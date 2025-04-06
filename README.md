# App Manager

## Overview
App Manager is a microkernel-based system designed to manage modular applications (apps). The core functionality revolves around dynamically loading, enabling, and disabling apps within the system. Each app must be correctly registered and adhere to a specific structure to ensure smooth integration.

## App Structure
An app must be defined as a class that extends the `AbstractApp` class. This class serves as the entry point and defines the interaction between the app and the App Manager system.

### Example App Definition
```typescript
import {AbstractApp} from "../../../dist/lib/AbstractApp";
import {AppManager} from "../../../dist/lib/AppManager";
import {Collection, CollectionHandler} from "../../../dist/lib/decorators/appUtils";

import {ExampleModel} from "./models/ExampleModel";
import ExampleController from "./controllers/ExampleController";
import {AbstractCollectionHandler} from "../../../dist/lib/CollectionStorage";
import {CollectionItem} from "../../../dist/lib/CollectionStorage";
import {ExampleSetting} from "./settings/exampleSetting";

class Resolver {
  name: string = "ExampleResolver";
}

class ResolverHandler extends AbstractCollectionHandler {
  async process(appManager: AppManager, data: CollectionItem[]): Promise<void> {
    console.log("ResolverHandler processed")
  }

  async unprocess(appManager: AppManager, data: CollectionItem[]): Promise<void> {
    console.log("ResolverHandler unprocessed")
  }
}

/**
 * Developer can decide which fields he needs to be appended to appManager by using decorator
 * */
export default class ExampleApp extends AbstractApp {
  appId = "example";
  name = "Example";

  @Collection
  controllers = [{route: "/example", controller: ExampleController}];

  @Collection
  models = [ExampleModel];

  @Collection
  settings = [ExampleSetting];

  @Collection
  resolvers = [Resolver];

  @CollectionHandler('resolvers')
  resolverHandler = new ResolverHandler();

  constructor(appManager: AppManager) {
    super(appManager);
  }

  mount(): Promise<void> {
    console.log("Example app mounted")
    return Promise.resolve();
  }

  unmount(): Promise<void> {
    console.log("Example app unmounted")
    return Promise.resolve();
  }
}

```

### Required Fields
- `appId: string` – Unique identifier for the app.
- `name: string` – Human-readable name of the app.

### Collection Fields (optional)
- `models: any[]` – Data models provided by the app.
- `controllers: IController[]` – App controllers for handling requests.
- `settings: ISettingConstructor[]` – Configuration settings specific to the app.
- `assets: string[]` - Assets paths.
- `events: IEventConstructor[]` - Declared app events.
- `middlewares: MiddlewareType[]` - Middleware functions.
- `installSteps: any[]` - Install steps for managing app settings before start it.

### Lifecycle Methods (required)
- `mount(): Promise<void>` – Defines the logic executed when the app is enabled.
- `unmount(): Promise<void>` – Defines the logic executed when the app is disabled.

## Collections and Handlers
The App Manager uses decorators to define collections and their handlers. A collection represents a group of related data (e.g., models, controllers, settings). Each collection can have a corresponding handler.

### Standard Collections
The following collections are built-in and have predefined handlers:
- `models`
- `controllers`
- `settings`
- `assets`
- `events`
- `middlewares`
- `installSteps`

Custom handlers **cannot** be assigned to these collections.

### Custom Collections
Developers can define custom collections using the `@Collection` decorator and assign handlers using `@CollectionHandler`. A collection and its handler do not necessarily have to be in the same module.
Each collection can only have one handler. Choose name for your collection wisely, try to make them unique, because they can be used by another apps.

```typescript
@Collection
resolvers = [() => {}];

@CollectionHandler('resolvers')
resolverHandler = new ResolverHandler();
```

### Handler Processing
When an app is mounted:
1. Collection handlers are registered and process their respective collections.
2. Collections are appended to the App Manager system.

When an app is unmounted:
1. Collection handlers unprocess their respective collections before being deleted.
2. Collections are removed from the App Manager.
