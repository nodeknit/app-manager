interface NavbarItem {
  id: string;
  name: string;
  link: string;
  icon: string;
}

interface Repository {
  id: string;
  name: string;
  link: string;
  type: 'local' | 'github' | 'storage';
}

export interface AppManagerConfig {
  navbar?: NavbarItem[]
  repositories?: Repository[]
  state?: {
    addNewApp?: boolean
    noAppsFound?: boolean
    restartRequired?: boolean
    notAvailableMarket?: boolean
    unknownError?: boolean
  }
  tempDirPath?: string
  appsPath?: string
  secret?: string
}
