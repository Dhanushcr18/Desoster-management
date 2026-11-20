import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import { RiskLevel } from './Road.model';

export type DecisionType = 'CONTINUE' | 'REROUTE' | 'HOLD' | 'ESCALATE';
export type ExplanationSource = 'gemini' | 'template';

export interface IAgentDecision {
  id?: number;
  shipmentId: number;
  roadId?: number | null;
  decision: DecisionType;
  riskScore: number;
  riskLevel: RiskLevel;
  reasoning: string;
  explanationSource: ExplanationSource;
  extraMinutes: number;
  estimatedDelayAvoidedMin: number;
  notified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

class AgentDecision extends Model<IAgentDecision> implements IAgentDecision {
  public id!: number;
  public shipmentId!: number;
  public roadId?: number | null;
  public decision!: DecisionType;
  public riskScore!: number;
  public riskLevel!: RiskLevel;
  public reasoning!: string;
  public explanationSource!: ExplanationSource;
  public extraMinutes!: number;
  public estimatedDelayAvoidedMin!: number;
  public notified!: boolean;
  public shipment?: any;
  public road?: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AgentDecision.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    shipmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Shipments',
        key: 'id',
      },
    },
    roadId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Roads',
        key: 'id',
      },
    },
    decision: {
      type: DataTypes.ENUM('CONTINUE', 'REROUTE', 'HOLD', 'ESCALATE'),
      allowNull: false,
    },
    riskScore: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    riskLevel: {
      type: DataTypes.ENUM('low', 'moderate', 'high', 'severe'),
      allowNull: false,
      defaultValue: 'low',
    },
    reasoning: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    explanationSource: {
      type: DataTypes.ENUM('gemini', 'template'),
      allowNull: false,
      defaultValue: 'template',
    },
    extraMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    estimatedDelayAvoidedMin: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    notified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'AgentDecision',
    tableName: 'AgentDecisions',
  }
);

export default AgentDecision;
