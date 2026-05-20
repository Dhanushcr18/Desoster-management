import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export interface IAlert {
  id?: number;
  title: string;
  description: string;
  longitude: number;
  latitude: number;
  severity: 'low' | 'medium' | 'high';
  source: string;
  verified: boolean;
  photos?: any; // JSON array
  resolved?: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  createdAt?: Date;
}

class Alert extends Model<IAlert> implements IAlert {
  public id!: number;
  public title!: string;
  public description!: string;
  public longitude!: number;
  public latitude!: number;
  public severity!: 'low' | 'medium' | 'high';
  public source!: string;
  public verified!: boolean;
  public photos?: string;
  public resolved!: boolean;
  public resolvedAt?: Date;
  public resolvedBy?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Alert.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
      validate: {
        min: -180,
        max: 180,
      },
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
      validate: {
        min: -90,
        max: 90,
      },
    },
    severity: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'medium',
    },
    source: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    photos: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    resolved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    resolvedBy: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'alerts',
    timestamps: true,
    indexes: [
      {
        fields: ['severity', 'createdAt'],
      },
      {
        fields: ['latitude', 'longitude'],
      },
    ],
  }
);

export default Alert;
