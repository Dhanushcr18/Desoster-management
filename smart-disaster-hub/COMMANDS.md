# 🎯 EXACT COMMANDS TO RUN THE APP

Copy and paste these commands exactly as shown for Windows PowerShell.

---

## ✅ PREREQUISITES CHECK

Make sure you have these installed:

```powershell
# Check Node.js (should be 18+)
node --version

# Check npm
npm --version

# Check Docker
docker --version
```

If anything is missing:
- Node.js: Download from https://nodejs.org/
- Docker Desktop: Download from https://www.docker.com/products/docker-desktop/

---

## 🚀 METHOD 1: DOCKER COMPOSE (EASIEST)

### Step 1: Navigate to Project
```powershell
cd "c:\Natural desoster\smart-disaster-hub"
```

### Step 2: Start All Services
```powershell
docker-compose up --build
```

**Wait 2-3 minutes for the build to complete.**

### Step 3: Access the App
Open your browser to: **http://localhost:5173**

### Step 4: Login
- **Email**: `john@example.com`
- **Password**: `password123`

### To Stop
Press `Ctrl+C` in the terminal, then:
```powershell
docker-compose down
```

---

## 💻 METHOD 2: LOCAL DEVELOPMENT

### Terminal 1: Start MongoDB

```powershell
# Navigate to project
cd "c:\Natural desoster\smart-disaster-hub"

# Start MongoDB container
docker run -d -p 27017:27017 --name mongodb mongo:7
```

### Terminal 2: Start Backend

```powershell
# Open a NEW terminal window/tab
cd "c:\Natural desoster\smart-disaster-hub\backend"

# Install dependencies (first time only)
npm install

# Copy environment file (first time only)
Copy-Item .env.example .env

# Start backend server
npm run dev
```

You should see: `🚀 Server running on port 3000`

### Terminal 3: Start Frontend

```powershell
# Open ANOTHER NEW terminal window/tab
cd "c:\Natural desoster\smart-disaster-hub\frontend"

# Install dependencies (first time only)
npm install

# Copy environment file (first time only)
Copy-Item .env.example .env

# Start frontend dev server
npm run dev
```

You should see: `Local: http://localhost:5173/`

### Step 4: Seed Sample Data

```powershell
# Open ANOTHER NEW terminal window/tab
cd "c:\Natural desoster\smart-disaster-hub\backend"

# Run seed script
npm run seed
```

You should see:
```
✅ Created 3 sample users
✅ Created 5 sample alerts
✅ Created 4 sample reports
```

### Step 5: Access the App
Open your browser to: **http://localhost:5173**

### Step 6: Login
- **Email**: `john@example.com`
- **Password**: `password123`

---

## 🧪 RUN TESTS

### Backend Tests
```powershell
cd "c:\Natural desoster\smart-disaster-hub\backend"
npm test
```

### Frontend Tests
```powershell
cd "c:\Natural desoster\smart-disaster-hub\frontend"
npm test
```

---

## 🔍 VERIFY EVERYTHING IS WORKING

### Check Backend
Open: http://localhost:3000/health

You should see:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Check Frontend
Open: http://localhost:5173

You should see the login page with:
- 🚨 Smart Disaster Hub heading
- Email and password fields
- Demo credentials shown

### Check MongoDB
```powershell
docker ps
```

You should see a container named `mongodb` or `disaster-hub-mongo` running.

---

## 🛑 STOP EVERYTHING

### If Using Docker Compose
```powershell
cd "c:\Natural desoster\smart-disaster-hub"
docker-compose down
```

### If Running Locally
1. Press `Ctrl+C` in each terminal window
2. Stop MongoDB:
```powershell
docker stop mongodb
docker rm mongodb
```

---

## 🐛 TROUBLESHOOTING

### "Port 3000 is already in use"
```powershell
# Find and kill the process
netstat -ano | findstr :3000
# Note the PID number, then:
taskkill /PID <number> /F
```

### "Port 5173 is already in use"
```powershell
# Find and kill the process
netstat -ano | findstr :5173
# Note the PID number, then:
taskkill /PID <number> /F
```

### "Cannot find module"
```powershell
# Backend
cd backend
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json -Force
npm install

# Frontend
cd frontend
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json -Force
npm install
```

### "MongoDB connection failed"
```powershell
# Check if MongoDB is running
docker ps

# If not running, start it
docker run -d -p 27017:27017 --name mongodb mongo:7

# If already exists but stopped
docker start mongodb
```

### Docker Compose Errors
```powershell
# Clean everything and rebuild
docker-compose down
docker system prune -f
docker-compose up --build
```

---

## ✅ QUICK TEST CHECKLIST

After starting the app, verify:

- [ ] Frontend loads at http://localhost:5173
- [ ] Backend health check works at http://localhost:3000/health
- [ ] Login page appears correctly
- [ ] Can login with john@example.com / password123
- [ ] Dashboard loads with map
- [ ] Sidebar shows 5 alerts
- [ ] Map shows 5 colored markers
- [ ] Can click an alert to see details
- [ ] Can mark status (I'm Safe / Request Help)
- [ ] Counter updates after submitting status

---

## 🎭 DEMO COMMANDS

```powershell
# 1. Start everything
cd "c:\Natural desoster\smart-disaster-hub"
docker-compose up --build

# 2. Open browser
# Go to http://localhost:5173

# 3. Login
# Email: john@example.com
# Password: password123

# 4. Click any HIGH priority alert (red)

# 5. Click "I'm Safe"

# 6. Add note: "At emergency shelter, have supplies"

# 7. Submit

# 8. Watch the counter update! ✨
```

---

## 📊 WHAT YOU SHOULD SEE

### On Dashboard:
- Header with "Smart Disaster Hub"
- Sidebar showing:
  - 3 HIGH priority alerts (red)
  - 2 MEDIUM priority alerts (yellow)
- Interactive map with 5 colored markers
- Each marker corresponds to an alert location

### When You Click an Alert:
- Modal appears with full alert details
- Community stats: "X Reported Safe, Y Need Help"
- Two big buttons: "I'm Safe" and "Request Help"
- Optional text area for notes

### After Submitting Status:
- Modal closes
- Counter updates instantly (real-time!)
- If you open another browser tab, it updates there too

---

## 🎯 READY FOR DEMO!

Everything should now be working perfectly. Practice the flow a few times:

1. Login
2. View alerts
3. Click HIGH priority alert
4. Submit status
5. See real-time update

**You're all set! Good luck! 🚀**

---

## 📞 NEED HELP?

Check these files:
- `README.md` - Full documentation
- `QUICKSTART.md` - Setup guide
- `DEMO.md` - Presentation tips
- `PROJECT_SUMMARY.md` - Complete overview

---

**Last Updated**: November 12, 2025
**Status**: ✅ All systems operational
