import { Table, Column, Model, DataType } from "sequelize-typescript";

@Table({ tableName: "Test", timestamps: false })
export class Test extends Model {
  // @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  // declare id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  title!: string;

  @Column(DataType.STRING)
  title_2?: string;

  @Column(DataType.STRING)
  test_ck5_1?: string;

  @Column(DataType.BOOLEAN)
  sort?: boolean;

  @Column(DataType.BOOLEAN)
  sort_test?: boolean;

  @Column(DataType.JSON)
  datatable?: object;

  @Column(DataType.JSON)
  image?: object;

  @Column(DataType.JSON)
  gallery?: object;

  @Column(DataType.JSON)
  file?: object;

  @Column(DataType.STRING)
  range?: string;

  @Column(DataType.JSON)
  json?: object;

  @Column(DataType.STRING)
  tui?: string;

  @Column(DataType.JSON)
  ace?: object;

  @Column(DataType.STRING)
  datetime?: string;

  @Column(DataType.STRING)
  date?: string;

  @Column(DataType.STRING)
  time?: string;

  @Column(DataType.INTEGER)
  number?: number;

  @Column(DataType.STRING)
  color?: string;

  @Column(DataType.STRING)
  week?: string;

  @Column(DataType.JSON)
  schedule?: object;

  @Column(DataType.STRING)
  select?: string;

  @Column(DataType.JSON)
  geojson?: object;

  @Column(DataType.STRING)
  guardedField?: string;
}
