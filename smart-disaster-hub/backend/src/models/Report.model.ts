import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User.model';
import Alert from './Alert.model';

export interface IReport {
  id?: number;
  alertId: number;
  userId?: number | null;
  status: 'safe' | 'help';
  note?: string;
  safeRadius?: number; // Safe radius in kilometers
  currentLongitude?: number;
  currentLatitude?: number;
  address?: string;
  landmark?: string;
  affectedRoad?: string;
  alternateRoute?: string;
  extraDistance?: number; // km extra via alternate route
  estimatedTime?: number; // minutes via alternate route
  routeDescription?: string;
  contactName?: string;
  contactPhone?: string;
  contactLocation?: string;
  createdAt?: Date;
}

class Report extends Model<IReport> implements IReport {
  public id!: number;
  public alertId!: number;
  public userId?: number | null;
  public status!: 'safe' | 'help';
  public note?: string;
  public safeRadius?: number;
  public currentLongitude?: number;
  public currentLatitude?: number;
  public address?: string;
  public landmark?: string;
  public affectedRoad?: string;
  public alternateRoute?: string;
  public extraDistance?: number;
  public estimatedTime?: number;
  public routeDescription?: string;
  public contactName?: string;
  public contactPhone?: string;
  public contactLocation?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Report.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    alertId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Alert,
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,     // null = anonymous/guest report
      references: {
        model: User,
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('safe', 'help'),
      allowNull: false,
    },
    note: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    safeRadius: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 1000,
      },
    },
    currentLongitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
      validate: {
        min: -180,
        max: 180,
      },
    },
    currentLatitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
      validate: {
        min: -90,
        max: 90,
      },
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    landmark: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    affectedRoad: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    alternateRoute: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    extraDistance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    estimatedTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    routeDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    contactName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    contactPhone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    contactLocation: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'reports',
    timestamps: true,
    indexes: [
      {
        // Only enforce uniqueness when userId is set (logged-in users)
        fields: ['alertId', 'status'],
      },
      {
        fields: ['userId', 'createdAt'],
      },
    ],
  }
);

export default Report;
