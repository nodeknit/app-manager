import {NextFunction, Request, Response} from "express";
import {AppManager} from "../lib/AppManager";
// import {I18n} from "../lib/v4/I18n";

declare global {
  type ReqType = Request & {
    // i18n: I18n
    appManager: AppManager
  }

  type ResType = Response & {
  }

  type MiddlewareType = (req: ReqType, res: ResType, next: NextFunction) => void
  type PropType<TObj, TProp extends keyof TObj> = TObj[TProp];
}

export {}
