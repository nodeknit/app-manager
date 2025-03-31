import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { InferAttributes, InferCreationAttributes } from "sequelize";

@Table({ tableName: 'apps', timestamps: false })
export class App extends Model<InferAttributes<App>, InferCreationAttributes<App>> {
  @Column({ type: DataType.STRING, allowNull: false, unique: true, primaryKey: true })
  declare appId: string;

  @Column(DataType.BOOLEAN)
  declare enable: boolean;
}
