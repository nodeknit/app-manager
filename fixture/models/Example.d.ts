import { Model } from "sequelize-typescript";
import { Test } from "./Test";
export declare class Example extends Model {
    title?: string;
    ownerId?: number;
    owner?: Test;
    gallery?: object;
    files?: object;
}
