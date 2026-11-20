import sequelize from './database';
import User from '../models/User.model';
import Alert from '../models/Alert.model';
import Report from '../models/Report.model';
import Road from '../models/Road.model';
import Warehouse from '../models/Warehouse.model';
import Shipment from '../models/Shipment.model';
import AgentDecision from '../models/AgentDecision.model';
import ReplayRun from '../models/ReplayRun.model';

// Existing associations
Alert.hasMany(Report, { foreignKey: 'alertId', as: 'reports' });
Report.belongsTo(Alert, { foreignKey: 'alertId', as: 'Alert' });

User.hasMany(Report, { foreignKey: 'userId', as: 'reports' });
Report.belongsTo(User, { foreignKey: 'userId', as: 'User' });

Alert.hasMany(Road, { foreignKey: 'relatedAlertId', as: 'roads' });
Road.belongsTo(Alert, { foreignKey: 'relatedAlertId', as: 'relatedAlert' });

User.hasMany(Road, { foreignKey: 'reportedBy', as: 'reportedRoads' });
Road.belongsTo(User, { foreignKey: 'reportedBy', as: 'reporter' });

// Resilience Supply Chain associations
Warehouse.hasMany(Shipment, { foreignKey: 'originWarehouseId', as: 'outgoingShipments' });
Warehouse.hasMany(Shipment, { foreignKey: 'destinationWarehouseId', as: 'incomingShipments' });
Shipment.belongsTo(Warehouse, { foreignKey: 'originWarehouseId', as: 'originWarehouse' });
Shipment.belongsTo(Warehouse, { foreignKey: 'destinationWarehouseId', as: 'destinationWarehouse' });

Shipment.hasMany(AgentDecision, { foreignKey: 'shipmentId', as: 'decisions' });
AgentDecision.belongsTo(Shipment, { foreignKey: 'shipmentId', as: 'shipment' });

Road.hasMany(AgentDecision, { foreignKey: 'roadId', as: 'decisions' });
AgentDecision.belongsTo(Road, { foreignKey: 'roadId', as: 'road' });

export {
  sequelize,
  User,
  Alert,
  Report,
  Road,
  Warehouse,
  Shipment,
  AgentDecision,
  ReplayRun,
};
