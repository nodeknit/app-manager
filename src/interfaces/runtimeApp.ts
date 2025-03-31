export default interface RuntimeApp {
  package: {
    name: string
    version: string
    description: string
    main?: string
    appId?: string
    appName?: string
    icon?: string | Buffer
    types?: string
    scripts?: {
      [key: string]: string
    }
    keywords?: string[],
    author?: string
    license?: string
    appManager?: {
      forbidDelete?: boolean
      appSpecificationVersion?: string
    }
    appDependencies?: {
      [key: string]: string
    }
    devDependencies?: {
      [key: string]: string
    }
    dependencies?: {
      [key: string]: string
    }
    webPacketApp?: boolean
  }
  appInstance?: any
  isSystemApp?: boolean
  repository?: string
  dirName?: string
  hasUnfilledSettings?: boolean
  enable: boolean
  versionToUpdate?: string
  // hasMigrations: boolean
}
