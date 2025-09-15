import { AbstractCollectionHandler, CollectionItem } from "../../lib/CollectionStorage";
import { AppManager } from "../../lib/AppManager";

export type Migration = {
  name: string;
  up: (args: { context: any }) => Promise<unknown> | unknown;
  down: (args: { context: any }) => Promise<unknown> | unknown;
};

type MigrationCollectionItem = CollectionItem & { item: Migration };

export class MigrationHandler extends AbstractCollectionHandler {
  async process(appManager: AppManager, data: MigrationCollectionItem[]): Promise<void> {
    // Prefer running migrations in production to avoid conflicts with dev sync
    if (process.env.NODE_ENV !== 'production' && process.env.USE_MIGRATIONS !== 'true') {
      AppManager.log.info('Skipping migrations (NODE_ENV!=production). Set USE_MIGRATIONS=true to force.');
      return;
    }

    let UmzugCtor: any, SequelizeStorageCtor: any;
    try {
      const umzugModule: any = await import('umzug');
      UmzugCtor = umzugModule.Umzug;
      SequelizeStorageCtor = umzugModule.SequelizeStorage;
    } catch (e) {
      AppManager.log.warn('Umzug not installed. Skipping migrations for this batch.');
      return;
    }

    const queryInterface = (appManager.sequelize as any).getQueryInterface?.() ?? null;

    const migrations = data.map(({ appId, item }) => ({
      name: `${appId}:${item.name}`,
      async up() { return item.up({ context: queryInterface }); },
      async down() { return item.down({ context: queryInterface }); },
    }));

    const umzug = new UmzugCtor({
      migrations,
      context: queryInterface,
      storage: new SequelizeStorageCtor({ sequelize: appManager.sequelize as any }),
    });

    await umzug.up();
    AppManager.log.info(`Migrations applied: [${migrations.map(m => m.name).join(', ')}]`);
  }

  async unprocess(appManager: AppManager, data: MigrationCollectionItem[]): Promise<void> {
    let UmzugCtor: any, SequelizeStorageCtor: any;
    try {
      const umzugModule: any = await import('umzug');
      UmzugCtor = umzugModule.Umzug;
      SequelizeStorageCtor = umzugModule.SequelizeStorage;
    } catch (e) {
      AppManager.log.warn('Umzug not installed. Cannot revert migrations for this batch.');
      return;
    }

    const queryInterface = (appManager.sequelize as any).getQueryInterface?.() ?? null;

    const migrations = data.map(({ appId, item }) => ({
      name: `${appId}:${item.name}`,
      async up() { return item.up({ context: queryInterface }); },
      async down() { return item.down({ context: queryInterface }); },
    }));

    const umzug = new UmzugCtor({
      migrations,
      context: queryInterface,
      storage: new SequelizeStorageCtor({ sequelize: appManager.sequelize as any }),
    });

    // Safety: do not automatically down in production unless explicitly allowed
    if (process.env.ALLOW_MIGRATIONS_DOWN === 'true') {
      await umzug.down({ to: 0 as any });
      AppManager.log.info(`Migrations reverted: [${migrations.map(m => m.name).join(', ')}]`);
    } else {
      AppManager.log.info('Skipping down migrations. Set ALLOW_MIGRATIONS_DOWN=true to enable.');
    }
  }
}
