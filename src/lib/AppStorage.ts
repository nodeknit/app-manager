import RuntimeApp from "../interfaces/runtimeApp";

export class AppStorage {
  private loadedApps: { [key: string]: RuntimeApp } = {}

  public add(appId: string, app: RuntimeApp) {
    this.loadedApps[appId] = app;
  }

  public delete(appId: string) {
    delete this.loadedApps[appId]
  }

  public getApps() {
    return this.loadedApps;
  }

  public get(appId: string)  {
    return this.loadedApps[appId];
  }
}
