# Smart Disaster Hub 🚨

A real-time disaster alert and coordination system that helps communities stay informed and connected during emergencies.

## 🎯 Overview

Smart Disaster Hub is a full-stack application that provides:
- **Real-time disaster alerts** with geographic mapping
- **Community coordination** - mark yourself safe or request help
- **Live updates** via WebSocket connections
- **Mobile-responsive** dashboard with interactive map
- **Secure authentication** and data protection

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **Leaflet** - Interactive maps (OpenStreetMap tiles)
- **Socket.IO Client** - Real-time communication
- **Vitest** - Unit testing

### Backend
- **Node.js 18+** with Express
- **TypeScript** - Type-safe backend
- **MongoDB** with Mongoose ODM
- **Socket.IO** - WebSocket server
- **JWT** - Secure authentication
- **bcrypt** - Password hashing
- **express-validator** - Input validation
- **Supertest** - Integration testing

### DevOps
- **Docker & Docker Compose** - Containerization
- **MongoDB** - Persistent data storage

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Docker and Docker Compose (for containerized setup)
- MongoDB (if running locally without Docker)

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

1. **Clone and navigate to project**
```bash
cd smart-disaster-hub
```

2. **Create environment files**
```bash
# Backend environment
cp backend/.env.example backend/.env

# Frontend environment
cp frontend/.env.example frontend/.env
```

3. **Start all services**
```bash
docker-compose up --build
```

4. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- MongoDB: localhost:27017

### Option 2: Local Development

#### Backend Setup

1. **Navigate to backend**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your settings
```

4. **Start MongoDB** (if not using Docker)
```bash
# macOS/Linux with Homebrew
brew services start mongodb-community

# Windows
net start MongoDB

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:7
```

5. **Run backend**
```bash
# Development mode with hot reload
npm run dev

# Production build
npm run build
npm start
```

Backend runs on: http://localhost:3000

#### Frontend Setup

1. **Navigate to frontend**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env if needed
```

4. **Run frontend**
```bash
npm run dev
```

Frontend runs on: http://localhost:5173

## 🧪 Running Tests

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📁 Project Structure

```
smart-disaster-hub/
├── backend/
│   ├── src/
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # Express routes
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth, validation
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Helper functions
│   │   ├── config/          # Configuration
│   │   ├── sockets/         # Socket.IO handlers
│   │   └── server.ts        # Entry point
│   ├── tests/               # Integration tests
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API & Socket clients
│   │   ├── context/         # React context
│   │   ├── hooks/           # Custom hooks
│   │   ├── utils/           # Helper functions
│   │   ├── types/           # TypeScript types
│   │   └── App.tsx          # Root component
│   ├── tests/               # Unit tests
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 🔑 Environment Variables

### Backend (.env)
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/disaster-hub
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
NODE_ENV=development

# Optional: External API integrations
OPENWEATHER_API_KEY=your-api-key-here
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000

# Optional: Switch to Mapbox (requires API key)
# VITE_MAPBOX_TOKEN=your-mapbox-token
```

## 🗺 Map Integration

### Using OpenStreetMap (Default - No API Key)
The app uses Leaflet with OpenStreetMap tiles by default. No configuration needed!

### Switching to Mapbox
1. Get a free API key from https://www.mapbox.com/
2. Add to `frontend/.env`:
```
VITE_MAPBOX_TOKEN=pk.your-token-here
```
3. Uncomment Mapbox layer in `frontend/src/components/MapView.tsx`

## 📱 SMS Notifications (Optional)

To enable Twilio SMS alerts:

1. Sign up at https://www.twilio.com/
2. Add credentials to `backend/.env`
3. Uncomment Twilio service calls in `backend/src/services/notification.service.ts`

## 🎭 Demo Flow (30-60 seconds)

Perfect for hackathon judges!

1. **Open the app** - Show the clean, responsive dashboard
2. **Register/Login** - Quick signup flow
3. **View live map** - Point out real-time alert markers
4. **Show sidebar** - Highlight active alerts with severity levels
5. **Click an alert** - Display details modal
6. **Mark status** - Click "I'm Safe" or "Request Help"
7. **Real-time update** - Show counter updating instantly (open second browser tab to demo)
8. **Create alert** (if time) - Show admin creating new alert
9. **Watch it appear** - Real-time Socket.IO update on map

### Demo Data
The backend includes seed data with sample alerts. Run:
```bash
cd backend
npm run seed
```

## 🔒 Security Notes

### For Production
- [ ] Change `JWT_SECRET` to a strong, random value
- [ ] Enable HTTPS/TLS
- [ ] Set up CORS properly
- [ ] Add rate limiting
- [ ] Enable MongoDB authentication
- [ ] Use environment-specific configs
- [ ] Add input sanitization
- [ ] Implement refresh tokens
- [ ] Add audit logging

### Hackathon Shortcuts
- Simple JWT implementation (no refresh tokens)
- Basic password validation
- Permissive CORS for development
- Mock external API services
- No rate limiting (add express-rate-limit for production)

## 🔧 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
docker ps | grep mongo

# View MongoDB logs
docker logs mongodb
```

### Port Already in Use
```bash
# Kill process on port 3000 (backend)
npx kill-port 3000

# Kill process on port 5173 (frontend)
npx kill-port 5173
```

### Socket.IO Connection Errors
- Ensure backend is running first
- Check CORS settings in `backend/src/server.ts`
- Verify `VITE_SOCKET_URL` in frontend .env

## 📦 API Documentation

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### Alerts

#### Get All Alerts
```http
GET /api/alerts?severity=high&bbox=-122.5,37.7,-122.3,37.9
Authorization: Bearer <token>
```

#### Get Single Alert
```http
GET /api/alerts/:id
Authorization: Bearer <token>
```

#### Create Alert
```http
POST /api/alerts
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Earthquake Warning",
  "description": "7.2 magnitude earthquake detected",
  "geometry": {
    "type": "Point",
    "coordinates": [-122.4194, 37.7749]
  },
  "severity": "high",
  "source": "USGS"
}
```

### Reports

#### Submit Status Report
```http
POST /api/reports
Authorization: Bearer <token>
Content-Type: application/json

{
  "alertId": "507f1f77bcf86cd799439011",
  "status": "safe",
  "note": "I'm at a safe location"
}
```

## 🤝 Contributing

This is a hackathon project, but contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 👥 Team

Built with ❤️ for disaster resilience and community safety.

## 🙏 Acknowledgments

- OpenStreetMap contributors
- Leaflet.js community
- Socket.IO team
- All open-source contributors

---

**Need help?** Open an issue or reach out to the team!

**🌟 Star this repo** if you find it useful!
