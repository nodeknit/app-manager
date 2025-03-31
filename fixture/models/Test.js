var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Table, Column, Model, DataType } from "sequelize-typescript";
let Test = class Test extends Model {
    // @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
    // declare id: number;
    title;
    title_2;
    test_ck5_1;
    sort;
    sort_test;
    datatable;
    image;
    gallery;
    file;
    range;
    json;
    tui;
    ace;
    datetime;
    date;
    time;
    number;
    color;
    week;
    schedule;
    select;
    geojson;
    guardedField;
};
__decorate([
    Column({ type: DataType.STRING, allowNull: false }),
    __metadata("design:type", String)
], Test.prototype, "title", void 0);
__decorate([
    Column(DataType.STRING),
    __metadata("design:type", String)
], Test.prototype, "title_2", void 0);
__decorate([
    Column(DataType.STRING),
    __metadata("design:type", String)
], Test.prototype, "test_ck5_1", void 0);
__decorate([
    Column(DataType.BOOLEAN),
    __metadata("design:type", Boolean)
], Test.prototype, "sort", void 0);
__decorate([
    Column(DataType.BOOLEAN),
    __metadata("design:type", Boolean)
], Test.prototype, "sort_test", void 0);
__decorate([
    Column(DataType.JSON),
    __metadata("design:type", Object)
], Test.prototype, "datatable", void 0);
__decorate([
    Column(DataType.JSON),
    __metadata("design:type", Object)
], Test.prototype, "image", void 0);
__decorate([
    Column(DataType.JSON),
    __metadata("design:type", Object)
], Test.prototype, "gallery", void 0);
__decorate([
    Column(DataType.JSON),
    __metadata("design:type", Object)
], Test.prototype, "file", void 0);
__decorate([
    Column(DataType.STRING),
    __metadata("design:type", String)
], Test.prototype, "range", void 0);
__decorate([
    Column(DataType.JSON),
    __metadata("design:type", Object)
], Test.prototype, "json", void 0);
__decorate([
    Column(DataType.STRING),
    __metadata("design:type", String)
], Test.prototype, "tui", void 0);
__decorate([
    Column(DataType.JSON),
    __metadata("design:type", Object)
], Test.prototype, "ace", void 0);
__decorate([
    Column(DataType.STRING),
    __metadata("design:type", String)
], Test.prototype, "datetime", void 0);
__decorate([
    Column(DataType.STRING),
    __metadata("design:type", String)
], Test.prototype, "date", void 0);
__decorate([
    Column(DataType.STRING),
    __metadata("design:type", String)
], Test.prototype, "time", void 0);
__decorate([
    Column(DataType.INTEGER),
    __metadata("design:type", Number)
], Test.prototype, "number", void 0);
__decorate([
    Column(DataType.STRING),
    __metadata("design:type", String)
], Test.prototype, "color", void 0);
__decorate([
    Column(DataType.STRING),
    __metadata("design:type", String)
], Test.prototype, "week", void 0);
__decorate([
    Column(DataType.JSON),
    __metadata("design:type", Object)
], Test.prototype, "schedule", void 0);
__decorate([
    Column(DataType.STRING),
    __metadata("design:type", String)
], Test.prototype, "select", void 0);
__decorate([
    Column(DataType.JSON),
    __metadata("design:type", Object)
], Test.prototype, "geojson", void 0);
__decorate([
    Column(DataType.STRING),
    __metadata("design:type", String)
], Test.prototype, "guardedField", void 0);
Test = __decorate([
    Table({ tableName: "Test", timestamps: false })
], Test);
export { Test };
