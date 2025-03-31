import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import { Test } from "./Test";

@Table({ tableName: "Example", timestamps: false })
export class Example extends Model {
  // @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  // declare id: number;

  @Column(DataType.STRING)
  title?: string;

  @ForeignKey(() => Test)
  @Column(DataType.INTEGER)
  ownerId?: number;

  @BelongsTo(() => Test)
  owner?: Test;

  @Column(DataType.JSON)
  gallery?: object;

  @Column(DataType.JSON)
  files?: object;
}
