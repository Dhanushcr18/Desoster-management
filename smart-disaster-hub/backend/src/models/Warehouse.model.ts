import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export type WarehouseType = 'hub' | 'depot' | 'hospital' | 'relief_camp';

export interface IWarehouse {
  id?: number;
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  type: WarehouseType;
  createdAt?: Date;
  updatedAt?: Date;
}

class Warehouse extends Model<IWarehouse> implements IWarehouse {
  public id!: number;
  public name!: string;
  public city!: string;
  public state!: string;
  public lat!: number;
  public lng!: number;
  public type!: WarehouseType;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Warehouse.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    lat: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    lng: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('hub', 'depot', 'hospital', 'relief_camp'),
      allowNull: false,
      defaultValue: 'depot',
    },
  },
  {
    sequelize,
    modelName: 'Warehouse',
    tableName: 'Warehouses',
  }
);

export default Warehouse;
