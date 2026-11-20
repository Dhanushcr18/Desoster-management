import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export interface IReplayRun {
  id?: number;
  scenario: string;
  startedAt: Date;
  status: 'running' | 'paused' | 'completed' | 'stopped';
  createdAt?: Date;
  updatedAt?: Date;
}

class ReplayRun extends Model<IReplayRun> implements IReplayRun {
  public id!: number;
  public scenario!: string;
  public startedAt!: Date;
  public status!: 'running' | 'paused' | 'completed' | 'stopped';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ReplayRun.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    scenario: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM('running', 'paused', 'completed', 'stopped'),
      allowNull: false,
      defaultValue: 'running',
    },
  },
  {
    sequelize,
    modelName: 'ReplayRun',
    tableName: 'ReplayRuns',
  }
);

export default ReplayRun;
