import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export interface IRoad {
  id?: number;
  name: string;
  description?: string;
  status: 'affected' | 'alternate' | 'normal';
  coordinates: [number, number][]; // JSON array of [lat, lng] pairs
  severity?: 'low' | 'medium' | 'high' | 'critical';
  reportedBy?: number; // User ID who reported it
  relatedAlertId?: number; // Link to related alert
  createdAt?: Date;
  updatedAt?: Date;
}

class Road extends Model<IRoad> implements IRoad {
  public id!: number;
  public name!: string;
  public description?: string;
  public status!: 'affected' | 'alternate' | 'normal';
  public coordinates!: [number, number][];
  public severity?: 'low' | 'medium' | 'high' | 'critical';
  public reportedBy?: number;
  public relatedAlertId?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Road.init(
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('affected', 'alternate', 'normal'),
      allowNull: false,
      defaultValue: 'normal',
    },
    coordinates: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Array of [lat, lng] coordinate pairs',
    },
    severity: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: true,
    },
    reportedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    relatedAlertId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Alerts',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'Road',
    tableName: 'Roads',
  }
);

export default Road;
