import express, {Express} from "express";
import {Model, Sequelize} from "sequelize-typescript";
import * as path from "node:path";
import winston from "winston";
import {AppManagerConfig} from "../interfaces/appManagerConfig";
import {CollectionStorage} from "./CollectionStorage";
import {SettingStorage} from "./SettingStorage";
import {AppStorage} from "./AppStorage";
import {ModelStatic} from "sequelize";
import {AbstractApp} from "./AbstractApp";
import RuntimeApp from "../interfaces/runtimeApp";
import getDefaultConfig from "../system/defaults";
import fs from "fs";
import {AsyncEventEmitter} from "./AsyncEventEmitter";
import { Server, IncomingMessage, ServerResponse } from "node:http";

export class AppManager {
  public config: AppManagerConfig
  public sequelize: Sequelize
  public collectionStorage: CollectionStorage;
  public settingStorage: SettingStorage;
  public appStorage: AppStorage;
  public emitter: AsyncEventEmitter;
  
  
  public app: Express
  /**
   * * @description The server instance
  */
  public server: Server<typeof IncomingMessage, typeof ServerResponse>
  public lift(port: number): Server<typeof IncomingMessage, typeof ServerResponse> {
    this.server = this.app.listen(port, () => {
       AppManager.log.info(`AppManager started on http://localhost:${port}`);
    });
    return this.server;
  }

  static logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(({timestamp, level, message, ...meta}) => {
        const metaString = Object.keys(meta).length ? JSON.stringify(meta) : "";
        return `[${timestamp}] ${level.toUpperCase()}: ${message} ${metaString}`;
      })
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({filename: "logs/app.log"}),
    ],
  })

  constructor(sequelize: Sequelize) {
    this.app = express();
    this.app.use(express.json());
    
    this.sequelize = sequelize;
    this.collectionStorage = new CollectionStorage(this);
    this.settingStorage = new SettingStorage();
    this.appStorage = new AppStorage();
    this.emitter = new AsyncEventEmitter();

    // // set views
    // this.app.set("view engine", "ejs");
    // this.app.set("views", path.join(import.meta.dirname, "../views"));
  }

  public async init(config: AppManagerConfig) {
    if (this.config && Object.keys(this.config).length > 0) {
      throw new Error("Config has already been initialized");
    }

    // Merge custom config with default
    const defaultConfig = getDefaultConfig();
    this.config = {...defaultConfig, ...config};

    // create appsPath directory if not exists
    const appsPath = this.config.appsPath;
    if (!fs.existsSync(appsPath)) {
      fs.mkdirSync(appsPath);
    }

    // TODO manage translations later
    // if (I18n.appendLocale) {
    //   bindTranslations(this);
    // } else {
    //   this.config.translation = false
    // }

    // bind own assets
    this.app.use('/assets', express.static(path.join(import.meta.dirname, '../assets')));

    // bind policies (add appManager in req for now)
    this.app.use('/', (req: ReqType, res: ResType, next: () => void) => {
      req.appManager = this;
      next();
    });
  }

  public async mountApp(app: RuntimeApp): Promise<void> {
    try {
      await app.appInstance._mount();

    } catch (error) {
      AppManager.log.error(`Error trying to mount app ${app.package.appId}`, error)
    }
  }

  public getModel<T extends Model>(modelClass: new () => T): ModelStatic<T> {
    const modelName = modelClass.name;
    const model = this.sequelize.models[modelName] as ModelStatic<T>;

    if (!model) {
      throw new Error(`Model ${modelName} not found in sequelize.models`);
    }

    return model;
  }

  public getApp<T extends AbstractApp>(appClass: new () => T): T {
    const appName = appClass.name;
    const app = this.appStorage.get(appName) as unknown as T;

    if (!app) {
      throw new Error(`App ${appName} not found in appStorage`);
    }

    return app;
  }

  static get log() {
    return {
      info: (...args: any[]) => this.logger.info(args.join(" ")),
      warn: (...args: any[]) => this.logger.warn(args.join(" ")),
      error: (...args: any[]) => {
        const [error] = args;
        if (error instanceof Error) {
          this.logger.error(`${error.message}\nStack: ${error.stack}`);
        } else {
          this.logger.error(args.join(" "));
        }
      },
      debug: (...args: any[]) => this.logger.debug(args.join(" ")),
      verbose: (...args: any[]) => this.logger.verbose(args.join(" ")),
      silly: (...args: any[]) => this.logger.silly(args.join(" ")),
    };
  }
}

