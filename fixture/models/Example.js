var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import { Test } from "./Test";
let Example = class Example extends Model {
    // @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
    // declare id: number;
    title;
    ownerId;
    owner;
    gallery;
    files;
};
__decorate([
    Column(DataType.STRING),
    __metadata("design:type", String)
], Example.prototype, "title", void 0);
__decorate([
    ForeignKey(() => Test),
    Column(DataType.INTEGER),
    __metadata("design:type", Number)
], Example.prototype, "ownerId", void 0);
__decorate([
    BelongsTo(() => Test),
    __metadata("design:type", Test)
], Example.prototype, "owner", void 0);
__decorate([
    Column(DataType.JSON),
    __metadata("design:type", Object)
], Example.prototype, "gallery", void 0);
__decorate([
    Column(DataType.JSON),
    __metadata("design:type", Object)
], Example.prototype, "files", void 0);
Example = __decorate([
    Table({ tableName: "Example", timestamps: false })
], Example);
export { Example };
