# 🚨 Smart Disaster Hub

[![Backend Status](https://img.shields.io/badge/Backend-Live%20on%20Render-brightgreen?logo=render)](https://desoster-management.onrender.com/health)
[![Frontend Status](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://vercel.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org/)
[![Google Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini-4285F4?logo=google)](https://aistudio.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A modern, real-time disaster management and emergency coordination platform designed to keep communities safe, informed, and connected during natural disasters. Features real-time mapping, SOS reporting, AI-powered emergency advisory, safe route evacuation analysis, and a dedicated admin response control center.

---

## 🌐 Live Deployments

| Component | Platform | URL |
| :--- | :--- | :--- |
| **Backend API** | Render (Docker) | [`https://desoster-management.onrender.com`](https://desoster-management.onrender.com) |
| **Backend Health Check** | Render | [`https://desoster-management.onrender.com/health`](https://desoster-management.onrender.com/health) |
| **Frontend Web App** | Vercel | *Your Vercel Domain* |

---

## ✨ Key Features

- **🗺️ Interactive Disaster Mapping**: Live incident mapping powered by Leaflet & OpenStreetMap, displaying floods, wildfires, cyclones, earthquakes, and hazard zones.
- **🤖 AI Disaster Assistant (Google Gemini)**: Built-in 24/7 intelligent assistant providing immediate emergency guidance, first-aid tips, evacuation steps, and emergency triage.
- **📡 Real-Time WebSocket Alerts**: Instant bi-directional broadcast via Socket.IO whenever new alerts or hazards are reported.
- **🆘 SOS & Safe Status Check-in**: Allows affected individuals to mark themselves safe or broadcast emergency help requests with geolocation and uploaded photos.
- **🛡️ Evacuation & Safe Route Visualizer**: Dynamic route analysis helping citizens navigate safely around hazard zones and blocked roads.
- **🔒 Dedicated Admin Control Center**: Separate secure administrator portal (`/admin/login`) featuring:
  - Real-time disaster statistics and priority heatmaps
  - Incident verification and status updates
  - Photo gallery verification for field reports
  - One-click emergency dispatch (Police, Fire, Ambulance auto-dialing)

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Bundler & Tooling**: Vite
- **Styling**: Tailwind CSS, Lucide React Icons
- **Mapping**: Leaflet, React-Leaflet
- **Networking**: Axios & Socket.IO Client

### Backend
- **Runtime**: Node.js 18+ with Express & TypeScript
- **Database & ORM**: SQLite (`disaster_hub.db`) & MySQL support via Sequelize ORM
- **Real-Time Engine**: Socket.IO
- **AI Integration**: Google Gemini API (`@google/generative-ai`)
- **Security**: JWT (JSON Web Tokens), bcrypt password hashing, Helmet, CORS protection

### DevOps & Deployment
- **Backend**: Render via Docker container (Alpine Linux)
- **Frontend**: Vercel SPA (with `vercel.json` rewrite routing)
- **Local Dev**: Docker Compose support

---

## 📁 Repository Structure

```text
smart-disaster-hub/
├── backend/
│   ├── src/
│   │   ├── config/            # Database (Sequelize) & models config
│   │   ├── controllers/       # Auth, Alert, Report, Road, AI controllers
│   │   ├── middleware/        # Auth (JWT) & error handling middleware
│   │   ├── models/            # Sequelize models (User, Alert, Report, Road)
│   │   ├── routes/            # Express REST route definitions
│   │   ├── services/          # Gemini AI, external weather, notifications
│   │   ├── sockets/           # Socket.IO connection handlers
│   │   ├── utils/             # Database seeding utilities
│   │   └── server.ts          # Express HTTP & Socket.IO server entrypoint
│   ├── disaster_hub.db        # SQLite database
│   ├── Dockerfile             # Production container definition
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/        # React UI components (Dashboard, Map, Chat, Admin)
│   │   ├── context/           # AuthContext & state providers
│   │   ├── services/          # API client & WebSocket client
│   │   ├── types/             # TypeScript type definitions
│   │   ├── App.tsx            # Main application router
│   │   └── main.tsx           # React DOM root
│   ├── public/                # Static assets & redirects
│   ├── vercel.json            # Vercel SPA rewrite rules
│   ├── package.json
│   └── vite.config.ts
│
├── docker-compose.yml         # Local container orchestration
└── README.md                  # Project documentation
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js 18.x or later installed
- npm or yarn package manager
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/Dhanushcr18/Desoster-management.git
cd Desoster-management/smart-disaster-hub
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create environment configuration
cp .env.example .env
```

Edit `backend/.env` with your values:
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_gemini_api_key_here
```

Start the backend:
```bash
# Development mode (auto-reload)
npm run dev

# Or build and run production
npm run build
npm start
```
*Backend runs on: `http://localhost:3000`*

### 3. Frontend Setup
Open a new terminal window:
```bash
cd ../frontend

# Install dependencies
npm install

# Create environment configuration
cp .env.example .env
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

Start the frontend:
```bash
npm run dev
```
*Frontend runs on: `http://localhost:5173`*

---

## 📡 API Endpoints Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user | No |
| `POST` | `/api/auth/login` | Authenticate & obtain JWT | No |
| `GET` | `/api/auth/profile` | Get current logged-in user profile | Bearer Token |

### 🚨 Disaster Alerts (`/api/alerts`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/alerts` | Get all active disaster alerts | No |
| `POST` | `/api/alerts` | Create a new alert (broadcasts via Socket.IO) | Bearer Token |
| `GET` | `/api/alerts/:id` | Get specific alert details | No |
| `PUT` | `/api/alerts/:id` | Update alert status/severity | Admin |

### 📋 Reports & Help Requests (`/api/reports`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reports` | Get user incident/SOS reports | No |
| `POST` | `/api/reports` | Submit emergency help request or hazard report | Optional |
| `PUT` | `/api/reports/:id` | Update report status | Admin |

### 🛣️ Safe Routes (`/api/roads`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/roads` | Fetch road status & blockage information | No |
| `POST` | `/api/roads/report` | Report damaged or blocked roadway | Bearer Token |

### 🤖 Gemini AI Assistant (`/api/ai`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ai/chat` | Send question to Gemini AI assistant | No |

### 💓 Health Check
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Returns server health status `{ "status": "ok" }` |

---

## ☁️ Deployment Guide

### Deploying Backend to Render (Docker)
1. In Render Dashboard, click **New +** > **Web Service**.
2. Connect your GitHub repository: `Dhanushcr18/Desoster-management`.
3. Set the following configuration:
   - **Language**: `Docker`
   - **Root Directory**: `smart-disaster-hub/backend`
   - **Dockerfile Path**: `smart-disaster-hub/backend/Dockerfile`
   - **Docker Build Context**: `smart-disaster-hub/backend`
   - **Health Check Path**: `/health`
4. Add **Environment Variables**:
   - `PORT`: `3000`
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: *(your secret or click Generate)*
   - `JWT_EXPIRES_IN`: `7d`
   - `GEMINI_API_KEY`: *(your Gemini key)*
5. Click **Deploy Web Service**.

### Deploying Frontend to Vercel
1. In Vercel Dashboard, click **Add New** > **Project**.
2. Import `Dhanushcr18/Desoster-management`.
3. Configure settings:
   - **Root Directory**: `smart-disaster-hub/frontend`
   - **Framework Preset**: `Vite`
4. Under **Environment Variables**, add:
   - `VITE_API_URL`: `https://desoster-management.onrender.com`
   - `VITE_SOCKET_URL`: `https://desoster-management.onrender.com`
5. Click **Deploy**.

---

## 🛡️ Admin Portal Access

The application features a standalone administrative portal for emergency responders:
- **Direct Route**: Navigate to `/admin/login`
- **Footer Link**: Click the "Administrator Access" link in the homepage footer.
- **Capabilities**: Incident triage, live report verification, emergency caller dispatch, and alert broadcasts.
- For complete operational details, refer to `../ADMIN_ACCESS_GUIDE.md`.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
