import {AbstractApp} from "../../lib/AbstractApp";
import {AbstractEvent} from "../../lib/AsyncEventEmitter";

export class EventAppLoaded extends AbstractEvent {
  key: string = "app-manager:app-loaded"
  name: string = "App Loaded";
  description: string = "Signalize that app is already loaded";
  arguments: Array<any> = [AbstractApp];
}
