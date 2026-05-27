import sequelize from './database';
import User from '../models/User.model';
import Alert from '../models/Alert.model';
import Report from '../models/Report.model';
import Road from '../models/Road.model';

// Initialize associations
Alert.hasMany(Report, { foreignKey: 'alertId', as: 'reports' });
Report.belongsTo(Alert, { foreignKey: 'alertId', as: 'Alert' });

User.hasMany(Report, { foreignKey: 'userId', as: 'reports' });
Report.belongsTo(User, { foreignKey: 'userId', as: 'User' });

Alert.hasMany(Road, { foreignKey: 'relatedAlertId', as: 'roads' });
Road.belongsTo(Alert, { foreignKey: 'relatedAlertId', as: 'relatedAlert' });

User.hasMany(Road, { foreignKey: 'reportedBy', as: 'reportedRoads' });
Road.belongsTo(User, { foreignKey: 'reportedBy', as: 'reporter' });

export { sequelize, User, Alert, Report, Road };
