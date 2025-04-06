import {AbstractApp} from "../lib/AbstractApp.js";
import {Collection, CollectionHandler} from "../lib/decorators/appUtils.js";
import {ModelHandler} from "./handlers/ModelHandler.js";
import {App} from "./models/App.js";
import {Setting} from "./models/Setting.js";
import {AppManager} from "../lib/AppManager.js";
import fs from "fs";
import path from "path";
import semver from "semver";
import RuntimeApp from "../interfaces/runtimeApp";
import {SettingHandler} from "./handlers/SettingHandler.js";
import {AllowUnsafeSettings} from "./settings/allowUnsafeSettings.js";
import {pathToFileURL} from "url";
import SwitchController from "./controllers/SwitchController.js";
import {ControllerHandler} from "./handlers/ControllerHandler.js";
import {EventHandler} from "./handlers/EventHandler.js";
import {EventAppLoaded} from "./events/appEvents.js";


export default class SystemApp extends AbstractApp {
  appId = "system";
  name = "System";

  @Collection
  models = [App, Setting];

  @CollectionHandler('models')
  modelHandler = new ModelHandler()

  @Collection
  controllers = [{route: '/switch', controller: SwitchController}];

  @CollectionHandler('controllers')
  controllerHandler = new ControllerHandler();

  @Collection
  settings = [AllowUnsafeSettings];

  @CollectionHandler('settings')
  settingHandler = new SettingHandler();

  @Collection
  events = [EventAppLoaded];

  @CollectionHandler('events')
  eventHandler = new EventHandler();

  constructor(appManager: AppManager) {
    super(appManager);
  }

  async mount(): Promise<void> {
    // load apps in storage
    await this.loadApps();

    const appQueueToMount = this.getAppQueueToMount();
    for (let app of appQueueToMount) {
      await this.appManager.mountApp(app);
    }

    AppManager.log.info("System app mounted");
  }

  unmount(): Promise<void> {
    AppManager.log.info("System app unmounted");
    return Promise.resolve(undefined);
  }

  // TODO add migrations, translations (I18n from adminizer short), stepper from adminizer

  /** Filter apps by enable flag and sort them by appDependencies */
  getAppQueueToMount(): RuntimeApp[] {
    const loadedApps = this.appManager.appStorage.getApps();
    // Filter out disabled apps
    const enabledApps = Object.values(loadedApps).filter(app => app.enable);
    const appMap = new Map<string, RuntimeApp>();
    const inDegree = new Map<string, number>();
    const graph = new Map<string, string[]>();

    // Initialize maps for tracking dependencies and graph structure
    enabledApps.forEach(app => {
      const appId = app.package.appId;
      appMap.set(appId, app);
      inDegree.set(appId, 0);
      graph.set(appId, []);
    });

    // Build the dependency graph and calculate in-degree (number of dependencies)
    enabledApps.forEach(app => {
      const appId = app.package.appId;
      if (!app.package.appDependencies) return;

      Object.keys(app.package.appDependencies).forEach(dep => {
        if (appMap.has(dep)) {
          graph.get(dep)!.push(appId);
          inDegree.set(appId, (inDegree.get(appId) || 0) + 1);
        }
      });
    });

    // Remove apps that have dependencies that are not enabled
    enabledApps.forEach(app => {
      const appId = app.package.appId;
      if (!app.package.appDependencies) return;

      const missingDeps = Object.keys(app.package.appDependencies).some(dep => !appMap.has(dep));
      if (missingDeps) {
        appMap.delete(appId);
        inDegree.delete(appId);
        graph.delete(appId);
      }
    });

    // Find all apps with no dependencies (in-degree == 0) and add them to the queue
    const queue: string[] = [];
    inDegree.forEach((degree, appId) => {
      if (degree === 0) queue.push(appId);
    });

    const sortedApps: RuntimeApp[] = [];
    let processed = 0;

    // Process the queue in topological order
    while (queue.length > 0) {
      const appId = queue.shift()!;
      sortedApps.push(appMap.get(appId)!);
      processed++;

      for (const dependent of graph.get(appId)!) {
        inDegree.set(dependent, inDegree.get(dependent)! - 1);
        if (inDegree.get(dependent) === 0) queue.push(dependent);
      }
    }

    // Detect circular dependencies by checking if all apps were processed
    if (processed !== appMap.size) {
      throw new Error("Circular dependency detected trying to create app queue. External maintenance required");
    }

    return sortedApps;
  }

  async loadApps(): Promise<void> {
    if (!fs.existsSync(this.appManager.config.appsPath)) {
      AppManager.log.error("No apps found");
      return;
    }

    // load apps from config.appsPath
    let appsDir = fs.readdirSync(this.appManager.config.appsPath);
    // convert relative apps' path to absolute path
    appsDir = appsDir.map((appDir: string) => `${this.appManager.config.appsPath}/${appDir}`);

    // add system apps from process.env to loading, system apps should be loaded first
    let systemApps = process.env.MM_SYSTEM_APPS ? process.env.MM_SYSTEM_APPS.split(";") : [];
    appsDir = systemApps.concat(appsDir);

    for (let appPath of appsDir) {
      try {
        await this.checkApp(appPath);
        await this.loadApp(appPath);

      } catch (error) {
        if (error.logTag === "warn") {
          AppManager.log.warn(`Can not load app [${appPath}]`, error.message);

        } else if (error.logTag === "info") {
          AppManager.log.info(`Can not load app [${appPath}]`, error.message);

        } else {
          AppManager.log.error(`Can not load app [${appPath}]`, error.stack);
        }
      }
    }
  }

  async checkApp(appPath: string) {
    if (!fs.lstatSync(`${appPath}`).isDirectory() && !fs.lstatSync(`${appPath}`).isSymbolicLink()) {
      throw {message: `${appPath} is not a directory or a symbolic link to a directory. Skipping...`, logTag: "info"};
    }

    let appDir = fs.readdirSync(`${appPath}`);
    if (!appDir.includes("package.json")) {
      throw {message: `${appPath}: No package.json file found. Skipping...`, logTag: "warn"};

    } else {
      let packageJSON = JSON.parse(fs.readFileSync(`${appPath}/package.json`, {encoding: "utf-8", flag: "r"}));
      if (!packageJSON.name || !packageJSON.version || !packageJSON.description) {
        throw {message: `${appPath}: Missed one or more required fields in package.json. Skipping...`, logTag: "warn"};
      }

      // check if app can be installed
      let projectPackageJSON = JSON.parse(fs.readFileSync(`${process.cwd()}/package.json`, {encoding: "utf-8", flag: "r"}));
      let currentDependencies = projectPackageJSON.appDependencies;
      let requiredDependencies = packageJSON.appDependencies;
      let canBeInstalled = this.canBeInstalled(requiredDependencies, currentDependencies);

      if (canBeInstalled.response === false) {
        throw {
          message: `${appPath}: Can not be loaded due to missing dependencies`,
          errors: canBeInstalled.errors,
          logTag: "warn"
        }
      }
    }
  }

  async loadApp(appPath: string, repository?: string): Promise<void> {
    let appDir = fs.readdirSync(appPath);
    let packageJSON = JSON.parse(fs.readFileSync(`${appPath}/package.json`, {encoding: "utf-8", flag: "r"})) as RuntimeApp["package"];
    let runtimeApp = {} as RuntimeApp;

    if (!packageJSON.appId) {
      packageJSON.appId = packageJSON.name.replace(/^(@.+?[\/\\])?/, "");
    }

    if (!packageJSON.appName) {
      packageJSON.appName = packageJSON.appId;
    }

    if (!packageJSON.appDependencies) {
      packageJSON.appDependencies = {};
    }

    if (!semver.valid(packageJSON.version)) {
      throw {message: `${packageJSON.appId}: Following version is not valid: ${packageJSON.version}. Skipping...`, logTag: "warn"};
    }

    if (!packageJSON.main) {
      throw {message: `${packageJSON.appId}: main file is not defined. Skipping...`, logTag: "warn"};
    }

    const AppClass = (await import(pathToFileURL(`${appPath}/${packageJSON.main}`).href)).default;
    runtimeApp["appInstance"] = new AppClass(this.appManager);

    runtimeApp["package"] = packageJSON;
    runtimeApp["dirName"] = path.basename(appPath);

    if (appDir.includes("icon.svg")) {
      runtimeApp["package"]["icon"] = fs.readFileSync(`${appPath}/icon.svg`);
    }

    // TODO handle migration later
    // if (fs.existsSync(`${appPath}/migrations`)) {
    //   runtimeApp["hasMigrations"] = true
    // }

    let systemAppList = this.getSystemAppList();
    runtimeApp["isSystemApp"] = systemAppList.includes(packageJSON.appId);

    // write data in App model
    let appsToEnable = process.env.INIT_APPS_TO_ENABLE ? process.env.INIT_APPS_TO_ENABLE.split(";") : [];

    const AppModel = this.appManager.getModel(App);
    let app = await AppModel.findOne({
      where: { appId: packageJSON.appId },
    });
    if (!app) {
      // creating record for installed app or database drop
      app = await AppModel.create({
        appId: packageJSON.appId,
        enable: appsToEnable.includes(packageJSON.appId) || systemAppList.includes(packageJSON.appId)
      });

    } else {
      // updating record if necessary
      if (app.enable === false && (appsToEnable.includes(packageJSON.appId) || systemAppList.includes(packageJSON.appId))) {
        await AppModel.update(
          { enable: true },
          { where: { appId: packageJSON.appId } }
        );
        app = await AppModel.findOne({
          where: { appId: packageJSON.appId },
        });
      }
    }

    // check hasUnfilledSettings flag
    let appSettings = this.appManager.settingStorage.getAppSettingSlots(packageJSON.appId)
    let hasUnfilledSettings = appSettings && appSettings.find(
      item => item.value === null && item.isRequired === true
    );

    if (hasUnfilledSettings) {
      runtimeApp["hasUnfilledSettings"] = true;
    }


    // TODO handle migrations later
    // // check migrations count and disable module if needed (only for postgres)
    // let datastore = sails.getDatastore();
    // if (datastore.config.adapter === 'sails-postgresql') {
    //   let migrationsCount = ModuleHelper.getMigrationsCount(modulePath);
    //   if (moduleFromDB.enable && !systemModuleList.includes(appId) && moduleFromDB.migrationsCount !== migrationsCount) {
    //     sails.log.warn(`Module ${appId} was disabled due to unprocessed migrations`)
    //     await Module.update({appId: appId}, {enable: false}).fetch();
    //     moduleFromDB = await Module.findOne({appId: appId}).populate("settings");
    //   }
    // }


    runtimeApp["enable"] = app.enable || false;
    runtimeApp["repository"] = repository;
    this.appManager.appStorage.add(packageJSON.appId, runtimeApp);
  }

  /**
   * Check that specific version of app (latest by default) can be installed with current dependencies
   * @param requiredDependencies - dependencies needed to install app (can be taken from module-storage [getModuleVersion])
   * @param currentDependencies - current dependencies that app has in package.json
   * */
  public canBeInstalled(requiredDependencies: { [key: string]: string }, currentDependencies: { [key: string]: string }): { response: boolean, errors: any } {
    if (requiredDependencies && Object.keys(requiredDependencies).length && !currentDependencies) {
      return {response: false, errors: {missingApps: Object.keys(requiredDependencies), outdatedApps: []}};
    }

    const missingApps = [];
    const outdatedApps = [];
    for (let dependency in requiredDependencies) {
      let requiredVersion = requiredDependencies[dependency];
      let currentVersion = currentDependencies[dependency];

      if (!currentVersion) {
        missingApps.push(dependency);
      } else if (semver.lt(currentVersion, requiredVersion)) {
        outdatedApps.push({app: dependency, currentVersion, requiredVersion});
      }
    }

    if (missingApps.length > 0 || outdatedApps.length > 0) {
      return {response: false, errors: {missingApps: missingApps, outdatedApps: outdatedApps}};

    } else {
      return {response: true, errors: null} // "All dependencies are up-to-date for this app"
    }
  }

  public getSystemAppList(): string[] {
    let systemAppList: string[] = [];

    if (process.env.MM_SYSTEM_APPS) {
      const appPaths = process.env.MM_SYSTEM_APPS.split(';');

      appPaths.forEach(appPath => {
        try {
          const packageJsonPath = path.join(appPath, 'package.json');
          if (fs.existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            if (packageJson.appId) {
              systemAppList.push(packageJson.appId);
            } else {
              systemAppList.push(packageJson.name.replace(/^(@.+?[\/\\])?/, ""));
            }
          }
        } catch (error) {
          AppManager.log.error(`Error reading package.json from ${appPath}:`, error);
        }
      });
    }

    return systemAppList;
  }
}
