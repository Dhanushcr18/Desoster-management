import { Sequelize } from 'sequelize';
import path from 'path';

// Use file-based SQLite for persistence
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(process.cwd(), 'disaster_hub.db'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

export const connectDB = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('✅ SQLite Database connected successfully');

    // Sync models with database - safe mode: only adds new tables/columns, never drops
    await sequelize.sync();
    console.log('✅ Database models synchronized');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

export default sequelize;
