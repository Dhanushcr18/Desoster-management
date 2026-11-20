import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export type RiskLevel = 'low' | 'moderate' | 'high' | 'severe';

export interface IRoad {
  id?: number;
  name: string;
  description?: string;
  status: 'affected' | 'alternate' | 'normal';
  coordinates: [number, number][]; // JSON array of [lat, lng] pairs
  severity?: 'low' | 'medium' | 'high' | 'critical';
  reportedBy?: number; // User ID who reported it
  relatedAlertId?: number; // Link to related alert
  // Risk assessment fields
  riskScore?: number;
  riskLevel?: RiskLevel;
  riskReason?: string;
  rainfall24h?: number;
  rainfall48h?: number;
  peakHourlyRain?: number;
  minElevation?: number;
  riverDischargeRatio?: number | null;
  lastAssessedAt?: Date;
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
  // Risk assessment fields
  public riskScore?: number;
  public riskLevel?: RiskLevel;
  public riskReason?: string;
  public rainfall24h?: number;
  public rainfall48h?: number;
  public peakHourlyRain?: number;
  public minElevation?: number;
  public riverDischargeRatio?: number | null;
  public lastAssessedAt?: Date;
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
    // Risk assessment columns
    riskScore: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
    },
    riskLevel: {
      type: DataTypes.ENUM('low', 'moderate', 'high', 'severe'),
      allowNull: false,
      defaultValue: 'low',
    },
    riskReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rainfall24h: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
    },
    rainfall48h: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
    },
    peakHourlyRain: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
    },
    minElevation: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    riverDischargeRatio: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    lastAssessedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Road',
    tableName: 'Roads',
  }
);

export default Road;
