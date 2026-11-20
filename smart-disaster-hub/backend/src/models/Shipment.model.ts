import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Warehouse from './Warehouse.model';

export type CargoType = 'medicine' | 'food' | 'fuel' | 'water' | 'general';
export type ShipmentPriority = 'critical' | 'high' | 'normal';
export type ShipmentStatus =
  | 'scheduled'
  | 'in_transit'
  | 'rerouted'
  | 'held'
  | 'delivered'
  | 'at_risk';

export interface GeoJsonLineString {
  type: 'LineString';
  coordinates: [number, number][]; // [lng, lat] per GeoJSON specification
}

export interface IShipment {
  id?: number;
  code: string;
  cargoType: CargoType;
  priority: ShipmentPriority;
  perishable: boolean;
  originWarehouseId: number;
  destinationWarehouseId: number;
  status: ShipmentStatus;
  departureTime?: Date;
  etaMinutes: number;
  currentLat: number;
  currentLng: number;
  progress: number;
  originalRoute: GeoJsonLineString;
  activeRoute: GeoJsonLineString;
  originalDurationMin: number;
  activeDurationMin: number;
  driverName: string;
  driverPhone?: string | null;
  telegramChatId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

class Shipment extends Model<IShipment> implements IShipment {
  public id!: number;
  public code!: string;
  public cargoType!: CargoType;
  public priority!: ShipmentPriority;
  public perishable!: boolean;
  public originWarehouseId!: number;
  public destinationWarehouseId!: number;
  public status!: ShipmentStatus;
  public departureTime?: Date;
  public etaMinutes!: number;
  public currentLat!: number;
  public currentLng!: number;
  public progress!: number;
  public originalRoute!: GeoJsonLineString;
  public activeRoute!: GeoJsonLineString;
  public originalDurationMin!: number;
  public activeDurationMin!: number;
  public driverName!: string;
  public driverPhone?: string | null;
  public telegramChatId?: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public originWarehouse?: Warehouse;
  public destinationWarehouse?: Warehouse;
}

Shipment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    cargoType: {
      type: DataTypes.ENUM('medicine', 'food', 'fuel', 'water', 'general'),
      allowNull: false,
      defaultValue: 'general',
    },
    priority: {
      type: DataTypes.ENUM('critical', 'high', 'normal'),
      allowNull: false,
      defaultValue: 'normal',
    },
    perishable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    originWarehouseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Warehouses',
        key: 'id',
      },
    },
    destinationWarehouseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Warehouses',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM(
        'scheduled',
        'in_transit',
        'rerouted',
        'held',
        'delivered',
        'at_risk'
      ),
      allowNull: false,
      defaultValue: 'scheduled',
    },
    departureTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    etaMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    currentLat: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    currentLng: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    progress: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.0,
    },
    originalRoute: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'GeoJSON LineString [lng, lat][]',
    },
    activeRoute: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'GeoJSON LineString [lng, lat][]',
    },
    originalDurationMin: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    activeDurationMin: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    driverName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Assigned Driver',
    },
    driverPhone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    telegramChatId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Shipment',
    tableName: 'Shipments',
  }
);

export default Shipment;
