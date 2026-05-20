# MySQL Setup Guide for Smart Disaster Hub

## Current Status
✅ Backend has been successfully migrated from MongoDB to MySQL using Sequelize ORM
✅ All code changes completed and compiled successfully
⚠️ MySQL is installed but requires authentication setup

## MySQL Authentication Setup

### Option 1: Using Your Existing MySQL Credentials
If you have MySQL installed with a specific root password, update your `.env` file:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=disaster_hub
```

### Option 2: Reset MySQL Root Password (Windows)
If you've forgotten your MySQL root password:

1. Stop MySQL service:
   ```bash
   net stop MySQL80
   ```

2. Start MySQL without password validation:
   ```bash
   "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --skip-grant-tables
   ```

3. Connect without password:
   ```bash
   mysql -u root
   ```

4. Reset password:
   ```sql
   FLUSH PRIVILEGES;
   ALTER USER 'root'@'localhost' IDENTIFIED BY '';
   ```

5. Exit and restart MySQL normally:
   ```bash
   net start MySQL80
   ```

### Option 3: Create New MySQL User
Connect to MySQL with admin credentials and create a new user:

```sql
CREATE USER 'disaster_hub'@'localhost' IDENTIFIED BY 'password123';
CREATE DATABASE IF NOT EXISTS disaster_hub;
GRANT ALL PRIVILEGES ON disaster_hub.* TO 'disaster_hub'@'localhost';
FLUSH PRIVILEGES;
```

Then update `.env`:
```env
DB_USER=disaster_hub
DB_PASSWORD=password123
```

## Verify MySQL Connection

Test your configuration with:
```bash
mysql -u [DB_USER] -p[DB_PASSWORD] -e "SELECT VERSION();"
```

Example with empty password:
```bash
mysql -u root -e "SELECT VERSION();"
```

## Start the Backend

Once MySQL is configured and accessible:

```bash
cd backend
npm install          # Install dependencies
npm run dev         # Start development server
```

The server will:
1. Connect to MySQL
2. Auto-create the `disaster_hub` database
3. Sync Sequelize models to create tables
4. Start listening on http://localhost:3000

## Populate Sample Data

```bash
npm run seed
```

This will create sample:
- Users (test accounts)
- Alerts (disaster scenarios)
- Reports (user responses)

## Troubleshooting

### "Access denied for user 'root'@'localhost'"
- Verify MySQL root password in `.env`
- Try resetting using Option 2 above
- Ensure MySQL service is running: `net start MySQL80`

### "Cannot find module 'mysql2'"
```bash
cd backend
npm install
```

### "ECONNREFUSED 127.0.0.1:3306"
- MySQL service is not running
- Check service: `net start MySQL80`
- Verify DB_HOST and DB_PORT in `.env`

### Tables not created automatically
- Check MySQL permissions for your user
- Try running seed: `npm run seed`
- Check logs for specific errors

## Next Steps

1. Configure MySQL credentials in `.env`
2. Verify MySQL connection
3. Start backend: `npm run dev`
4. Frontend will connect automatically (already running on port 5173)
5. Access the application at http://localhost:5173
