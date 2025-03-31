import { Table, Column, Model, DataType } from "sequelize-typescript";

@Table({ tableName: "JsonSchema", timestamps: false })
export class JsonSchema extends Model {
  // @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  // declare id: number;

  @Column(DataType.JSON)
  data?: object;
}
