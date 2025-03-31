import { Table, Column, Model, DataType } from "sequelize-typescript";

@Table({ tableName: "User", timestamps: false })
export class User extends Model {
  // @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  // declare id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  name!: string;
}
