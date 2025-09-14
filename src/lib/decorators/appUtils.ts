import "reflect-metadata";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

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

/**
 Проблема в том, что декораторы могут падать, если зависимая библиотека отсутствует или работает не так, как ожидается.
`safe` нужен, чтобы оборачивать такие декораторы и заставлять их тихо пропускать ошибки, не ломая весь код.
 
  Это используется чтобы оборачивать декораторы в апликациях которые могут в продакшене не иметь декораторов из модулей
*/
export function safeAppDecorator<TOptions extends (...a: any[]) => (v: any, c: any) => void>(
  moduleName: string, 
  decoratorName: string
): (options?: TOptions) => (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => any {
  return (options?: TOptions) => {
    return (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
      try {
        const module = require(moduleName);
        const decorator = module[decoratorName];
        return decorator(options)(target, propertyKey, descriptor);
      } catch (e) {
        // fallback
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[admin] decorator failed, skipped:', e);
        }
        return descriptor || target;
      }
    };
  };
}