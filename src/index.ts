import {Sequelize} from "sequelize-typescript";
import {AppManager} from "./lib/AppManager.js";
import getDefaultConfig from "./system/defaults.js";
import SystemApp from "./system/SystemApp.js";

process.env.SECRET = "secret";
process.env.INIT_APPS_TO_ENABLE = "example";

try {
  const sequelize = new Sequelize({
    database: "my_database",
    username: "username",
    password: "password",
    host: "localhost",
    dialect: "postgres",
    port: 5432,
  });

  await sequelize.authenticate();
  AppManager.log.info("Connected to PostgreSQL!");

  // Initializing App Manager
  const appManager = new AppManager(sequelize);

  const defaultConfig = getDefaultConfig();
  await appManager.init(defaultConfig);

  // Defining System App
  const systemApp = new SystemApp(appManager);
  await systemApp._mount();

  // Start Express-server
  // const PORT = appManager.config.port;
  const PORT = 3000;
  appManager.app.listen(PORT, () => {
    AppManager.log.info(`AppManager started on http://localhost:${PORT}`);
  });

} catch (err) {
  AppManager.log.error("Error starting App Manager:", err);
}
