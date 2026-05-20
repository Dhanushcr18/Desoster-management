import sequelize from './database';
import User from '../models/User.model';
import Alert from '../models/Alert.model';
import Report from '../models/Report.model';

// Initialize associations
Alert.hasMany(Report, { foreignKey: 'alertId', as: 'reports' });
Report.belongsTo(Alert, { foreignKey: 'alertId', as: 'Alert' });

User.hasMany(Report, { foreignKey: 'userId', as: 'reports' });
Report.belongsTo(User, { foreignKey: 'userId', as: 'User' });

export { sequelize, User, Alert, Report };
