# 🚀 Quick Start Guide

## The Fastest Way to Run Smart Disaster Hub

### Prerequisites
- Node.js 18+ installed
- Docker Desktop installed and running
- Git (optional)

---

## Option 1: Docker Compose (Recommended) ⭐

This starts everything with one command!

```powershell
# Navigate to project
cd smart-disaster-hub

# Start all services (backend + frontend + MongoDB)
docker-compose up --build
```

**Wait 1-2 minutes for build**, then access:
- 🌐 **Frontend**: http://localhost:5173
- 🔌 **Backend API**: http://localhost:3000
- 🗄️ **MongoDB**: localhost:27017

---

## Option 2: Local Development (For Coding)

### Terminal 1: Start MongoDB
```powershell
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:7
```

### Terminal 2: Start Backend
```powershell
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend runs on: http://localhost:3000

### Terminal 3: Start Frontend
```powershell
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs on: http://localhost:5173

---

## 📦 Seed Sample Data

After backend is running:

```powershell
cd backend
npm run seed
```

This creates:
- 3 sample users (john@example.com, jane@example.com, admin@example.com)
- 5 sample disaster alerts
- Sample status reports
- Password for all users: `password123`

---

## 🧪 Run Tests

### Backend Tests
```powershell
cd backend
npm test
```

### Frontend Tests
```powershell
cd frontend
npm test
```

---

## 🎭 Demo the App

1. **Login** with: `john@example.com` / `password123`
2. **View the map** - see 5 alerts across different locations
3. **Click an alert** - see details and community stats
4. **Mark your status** - "I'm Safe" or "Request Help"
5. **Watch real-time updates** - open in another browser to see live sync!

---

## 🛠️ Troubleshooting

### MongoDB Connection Failed
```powershell
# Check if MongoDB is running
docker ps

# Restart MongoDB
docker restart mongodb
```

### Port Already in Use
```powershell
# Kill process on port 3000 (backend)
npx kill-port 3000

# Kill process on port 5173 (frontend)
npx kill-port 5173
```

### Docker Build Issues
```powershell
# Clean and rebuild
docker-compose down
docker system prune -f
docker-compose up --build
```

### npm Install Errors
```powershell
# Clear npm cache and reinstall
cd backend  # or frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

## 🎯 Next Steps

- Read [README.md](README.md) for full documentation
- Check [DEMO.md](DEMO.md) for presentation script
- Explore the code in `backend/src` and `frontend/src`
- Customize `.env` files for your needs

---

## 🆘 Need Help?

Check the main README.md for:
- Detailed API documentation
- Architecture explanation
- External API integration guides
- Security best practices
- Deployment instructions

---

**Ready to save lives! 🚨💙**
