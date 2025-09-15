import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Sequelize } from 'sequelize-typescript';
import { AppManager } from '../src/lib/AppManager';
import { AbstractApp } from '../src/lib/AbstractApp';
import { Collection, CollectionHandler } from '../src/lib/decorators/appUtils';
import { MigrationHandler, Migration } from '../src/system/handlers/MigrationHandler';

// Ensure migrations are executed even in tests
process.env.NODE_ENV = 'production';

// Mock umzug to execute provided migrations immediately
vi.mock('umzug', () => {
  class Umzug {
    opts: any;
    constructor(opts: any) { this.opts = opts; }
    async up() { for (const m of this.opts.migrations) { await m.up(); } }
    async down() { for (const m of [...this.opts.migrations].reverse()) { await m.down(); } }
  }
  class SequelizeStorage { constructor(_: any) {} }
  return { Umzug, SequelizeStorage };
});

class HandlerApp extends AbstractApp {
  appId = 'handler-app';
  name = 'Handler App';

  @CollectionHandler('migrations')
  migrationHandler = new MigrationHandler();

  async mount() {}
  async unmount() {}
}

class TestApp extends AbstractApp {
  appId = 'test-app';
  name = 'Test App';

  order: string[];

  constructor(appManager: AppManager, order: string[]) {
    super(appManager);
    this.order = order;
  }

  @Collection
  migrations: Migration[] = [
    {
      name: '00-first',
      up: async ({ context }) => { this.order.push('migration-up'); expect(context).toBeDefined(); },
      down: async () => { this.order.push('migration-down'); },
    }
  ];

  async mount() { this.order.push('app-mount'); }
  async unmount() {}
}

describe('Migrations order', () => {
  let sequelize: Sequelize;
  let appManager: AppManager;

  beforeEach(async () => {
    sequelize = new Sequelize('sqlite::memory:');
    appManager = new AppManager(sequelize);
    await appManager.init({ appsPath: '/tmp' } as any);
  });

  it('runs migrations before app mount', async () => {
    const order: string[] = [];

    const handlerApp = new HandlerApp(appManager);
    await handlerApp._mount();

    const testApp = new TestApp(appManager, order);
    await testApp._mount();

    expect(order[0]).toBe('migration-up');
    expect(order[1]).toBe('app-mount');
  });
});

