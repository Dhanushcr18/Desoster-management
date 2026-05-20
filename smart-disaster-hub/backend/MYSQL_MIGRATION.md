# MySQL Migration Complete ✅

## Changes Made

### 1. **Package Dependencies Updated**
   - Removed: `mongoose` (MongoDB ODM)
   - Added: `mysql2` and `sequelize` (MySQL ORM)

### 2. **Database Configuration**
   - Created new Sequelize database connection in `src/config/database.ts`
   - MySQL connection uses environment variables:
     - `DB_HOST` (default: localhost)
     - `DB_PORT` (default: 3306)
     - `DB_USER` (default: root)
     - `DB_PASSWORD` (default: root)
     - `DB_NAME` (default: disaster_hub)

### 3. **Models Migrated to Sequelize**
   - **User Model**: Converted from Mongoose schema to Sequelize model
   - **Alert Model**: 
     - Changed from MongoDB geometry object to separate `longitude` and `latitude` fields
     - Photos stored as JSON array
   - **Report Model**:
     - Changed references from ObjectId to numeric foreign keys
     - Location details stored as individual columns instead of nested object
     - Added proper associations with Alert and User models

### 4. **Controllers Updated**
   - **auth.controller.ts**: Updated to use Sequelize `findOne({ where: { email } })` syntax
   - **alert.controller.ts**: Converted MongoDB aggregation to Sequelize queries using `sequelize.fn()`
   - **report.controller.ts**: Updated to use Sequelize relationships and aggregation

### 5. **Utilities Updated**
   - **seed.ts**: Converted from Mongoose bulk operations to Sequelize `bulkCreate()`

### 6. **Model Initialization**
   - Created `src/config/models.ts` to initialize all models and define relationships
   - Imported in `server.ts` to ensure models are properly initialized

## Environment Configuration

Update your `.env` file with MySQL credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=disaster_hub
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-in-production
GEMINI_API_KEY=your_key_here
```

## Database Setup

Before running the application, ensure MySQL is running:

### On Windows:
```bash
# If using MySQL from Windows Services (already installed)
net start MySQL80  # or your MySQL version

# Or using XAMPP/MariaDB
# Start from XAMPP Control Panel
```

### Create Database (Optional, Sequelize will auto-create):
```sql
CREATE DATABASE IF NOT EXISTS disaster_hub;
CREATE USER 'root'@'localhost' IDENTIFIED BY 'root';
GRANT ALL PRIVILEGES ON disaster_hub.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

## Running the Application

1. Install dependencies: `npm install`
2. Start MySQL service
3. Run backend: `npm run dev`
4. Sequelize will automatically sync the schema on startup

## Key Differences from MongoDB

| Aspect | MongoDB | MySQL |
|--------|---------|-------|
| Location Data | Geometry object with GeoJSON | Separate longitude/latitude columns |
| Photos | Array stored directly | JSON array field |
| Location Details | Nested object | Individual columns |
| Relationships | References (ObjectId) | Foreign Keys (numeric) |
| ID Type | ObjectId (string) | Auto-increment integer |

## Testing

Run seed command to populate test data:
```bash
npm run seed
```

Test credentials:
- Email: john@example.com
- Email: jane@example.com  
- Email: admin@example.com
- Password: password123
