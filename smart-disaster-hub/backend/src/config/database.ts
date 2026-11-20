import { Sequelize } from 'sequelize';
import path from 'path';

// Use file-based SQLite for persistence
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(process.cwd(), 'disaster_hub.db'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

/**
 * Non-destructive SQLite schema helper:
 * Safely adds new columns if they do not yet exist in the table.
 */
export const migrateRoadColumns = async (): Promise<void> => {
  try {
    const [cols]: any = await sequelize.query('PRAGMA table_info(Roads);');
    const existingColNames = new Set(cols.map((c: any) => c.name));

    const columnsToAdd: { name: string; type: string }[] = [
      { name: 'riskScore', type: 'FLOAT DEFAULT 0' },
      { name: 'riskLevel', type: "VARCHAR(20) DEFAULT 'low'" },
      { name: 'riskReason', type: 'TEXT' },
      { name: 'rainfall24h', type: 'FLOAT DEFAULT 0' },
      { name: 'rainfall48h', type: 'FLOAT DEFAULT 0' },
      { name: 'peakHourlyRain', type: 'FLOAT DEFAULT 0' },
      { name: 'minElevation', type: 'FLOAT' },
      { name: 'riverDischargeRatio', type: 'FLOAT' },
      { name: 'lastAssessedAt', type: 'DATETIME' },
    ];

    for (const col of columnsToAdd) {
      if (!existingColNames.has(col.name)) {
        await sequelize.query(`ALTER TABLE Roads ADD COLUMN ${col.name} ${col.type};`);
        console.log(`➕ Added missing column Roads.${col.name}`);
      }
    }
  } catch (err: any) {
    // If Roads table does not yet exist, sequelize.sync() creates it with all columns
  }
};

export const connectDB = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('✅ SQLite Database connected successfully');

    // Sync models with database
    await sequelize.sync();
    await migrateRoadColumns();
    console.log('✅ Database models synchronized and migrated');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

export default sequelize;
