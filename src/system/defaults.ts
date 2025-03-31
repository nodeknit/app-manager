import {AppManagerConfig} from "../interfaces/appManagerConfig";

export default function getDefaultConfig() {
  const appManagerConfig: AppManagerConfig = {
    state: {
      restartRequired: false,
      unknownError: false,
      notAvailableMarket: false,
      noAppsFound: false,
      addNewApp: true
    },
    appsPath: process.env.APPS_PATH ? process.env.APPS_PATH : `${process.cwd()}/apps`,
    tempDirPath: process.env.TEMP_DIR_PATH ? process.env.TEMP_DIR_PATH : `${process.cwd()}/.tmp`,
    navbar: [
      {
        id: "1",
        name: "My apps",
        link: `/app-manager/apps/my`,
        icon: "home"
      },
      {
        id: "2",
        name: "Updates",
        link: `/app-manager/apps/updates`,
        icon: "cloud-download-alt"
      },
      {
        id: "3",
        name: "Marketplace",
        link: `/app-manager/apps/market`,
        icon: "shopping-cart"
      }
    ]
  }

  return appManagerConfig;
};
