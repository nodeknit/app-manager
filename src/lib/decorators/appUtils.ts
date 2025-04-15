import "reflect-metadata";

export function AddToCollection(collectionName: string) {
  return function (target: any, propertyKey: string) {

    // Get current collection list
    const existingProperties = Reflect.getMetadata(collectionName, target) || [];

    // Add current field into collection
    Reflect.defineMetadata(collectionName, [...existingProperties, propertyKey], target);
  };
}

export function Collection(target: any, propertyKey: string) {
  const collectionName = propertyKey;

  // Get current collection list
  const existingProperties = Reflect.getMetadata(collectionName, target) || [];

  // Add current field into collection
  Reflect.defineMetadata(collectionName, [...existingProperties, propertyKey], target);
}

export function CollectionHandler(collectionName: string) {
  return function (target: any, propertyKey: string) {
    const existingHandlers = Reflect.getMetadata("collectionHandlers", target) || [];

    // Check that handler for current collection has been added to metadata
    if (existingHandlers.some((h: any) => h.collectionName === collectionName)) {
      throw new Error(`CollectionHandler for collection "${collectionName}" has already registered in class "${target.constructor.name}"`);
    }

    Reflect.defineMetadata("collectionHandlers", [...existingHandlers, { collectionName, propertyKey }], target);
  };
}

/** @warning Works only in collection items (like model, controller, setting etc.) */
export function AssignAppManager(target: any, propertyKey: any) {
  if (!Reflect.hasMetadata("assignAppManagerFields", target)) {
    Reflect.defineMetadata("assignAppManagerFields", [], target);
  }

  const fields: string[] = Reflect.getMetadata("assignAppManagerFields", target);
  fields.push(propertyKey);
  Reflect.defineMetadata("assignAppManagerFields", fields, target);
}
