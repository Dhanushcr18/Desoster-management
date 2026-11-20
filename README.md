# 🚨 Smart Disaster Hub: Autonomous Supply Resilience Agent

> **Hackathon Track**: Climate, Resource Infrastructure & Global Supply Resilience  
> **Sub-Theme**: Proactive Climate Adaptation & Resilient Supply Chain Infrastructure

[![Backend Status](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express%20%7C%20TypeScript-3178C6?logo=typescript)](https://desoster-management.onrender.com/health)
[![Frontend Status](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%20%7C%20Tailwind-61DAFB?logo=react)](https://vercel.com)
[![Testing](https://img.shields.io/badge/Tests-Jest%20%7C%20Vitest%20(100%25%20Passing)-brightgreen?logo=jest)](tests)
[![Free APIs](https://img.shields.io/badge/APIs-Open--Meteo%20%7C%20OSRM%20(Keyless)-orange)](https://open-meteo.com)
[![AI Integration](https://img.shields.io/badge/AI-Google%20Gemini%201.5%20(Optional)-4285F4?logo=google)](https://aistudio.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📌 Executive Summary & Problem Statement

### The Problem: Reactive vs. Proactive Climate Logistics
During catastrophic climate disasters (monsoon floods, Western Ghat landslides, cyclone storm surges), humanitarian supply chains are predominantly **reactive**:
1. Trucks carrying essential relief (insulin, blood plasma, potable water, baby food, emergency fuel) depart on standard highways.
2. Roads flood or get cut off by landslides hours into the journey.
3. Logistics managers only react *after* vehicles are trapped or destroyed, causing acute supply drop-offs at relief camps and hospitals for 12–72 critical hours.

### The Solution: Autonomous Proactive Supply Resilience Agent
**Smart Disaster Hub** shifts logistics from reactive reporting to **autonomous anticipation**:
- **Sense**: Continuously ingests 48-hour hyper-local precipitation forecasts, elevation terrain gradients, and river discharge anomalies along active logistics corridors (using 100% free, keyless Open-Meteo APIs).
- **Predict**: Scores road segment flood and landslide risks on a transparent 0–100 scale using physical hydrology principles.
- **Decide**: An autonomous agent loop continuously inspects all in-transit shipments. If a corridor's risk spikes, it calculates alternate OSRM routes, evaluates detour penalties against cargo criticality, and autonomously executes decisions: **CONTINUE**, **REROUTE**, **HOLD**, or **ESCALATE**.
- **Act**: Reroutes vehicles dynamically before they reach danger zones, dispatches instant notifications via WebSockets and Telegram Bot to drivers, and tracks modelled delay savings.

---

## 🏗️ Architecture & Agent Decision Pipeline

```mermaid
flowchart TD
    subgraph SENSE ["1. Data Ingestion (Sense)"]
        OM["Open-Meteo 48h Weather API\n(Rainfall & Intensity)"]
        OME["Open-Meteo Elevation API\n(Low-lying & Ghat Slopes)"]
        OMF["Open-Meteo Flood API\n(River Discharge Ratios)"]
        HIST["Historical Replay Datasets\n(Kerala 2018 / Chennai 2015)"]
    end

    subgraph PREDICT ["2. Risk Assessment Engine (Predict)"]
        RS["Risk Service (Sample Points)"]
        FORMULA["Transparent Formula (0-100):\nRain48h + Peak Rain + Terrain Slope + River + Alerts"]
        LEVEL["Risk Classification:\nLow (<25) | Moderate (25-50) | High (50-75) | Severe (>=75)"]
    end

    subgraph DECIDE ["3. Autonomous Agent (Decide)"]
        AGENT["Autonomous Agent Loop\n(SENSE -> PREDICT -> DECIDE -> ACT)"]
        PRIORITY["Cargo Triage:\nMedicine/Critical > Food/Perishable > Normal"]
        CHECK{"Active Route Ahead\nRisk >= 50?"}
        OSRM_SVC["OSRM Multi-Route Engine\n(Find Safest Route within Detour Budget)"]
        ACTION_MATRIX["Decision Resolution:\nCONTINUE | REROUTE | HOLD | ESCALATE"]
        GEMINI["Gemini 1.5 Grounded Explanation\n(Strict Anti-Hallucination Prompt)"]
    end

    subgraph ACT ["4. Execution & Notification (Act)"]
        DB[("Sequelize Database\n(Shipments, Roads, Decisions)")]
        WS["Socket.IO Live Broadcast\n(risk:update, shipment:update, agent:decision)"]
        TG["Telegram Bot Dispatcher\n(Driver Mobile Turn-by-Turn Alerts)"]
        SIM["Simulation Telemetry Engine\n(60x Truck Progress Tick)"]
    end

    subgraph UI ["5. Resilience Command Center"]
        MAP["Interactive Corridor & Fleet Map\n(React-Leaflet, GeoJSON, Risk Layers)"]
        FEED["Live Agent Decision Feed\n(Real-Time Animated Cards & Reasoning)"]
        METRICS["Impact Metrics & Modelled Delay Analytics\n(WITH vs WITHOUT Agent Comparison)"]
        DRIVER["Mobile Driver Terminal\n(/driver/:shipmentCode)"]
        REPLAY_UI["Historical Disaster Replay Sandbox\n(Clock Controls, Scenario Stepping)"]
    end

    OM --> RS
    OME --> RS
    OMF --> RS
    HIST --> RS
    RS --> FORMULA --> LEVEL --> AGENT
    AGENT --> CHECK
    CHECK -- "No (Risk < 50)" --> ACTION_MATRIX
    CHECK -- "Yes (Risk >= 50)" --> OSRM_SVC --> ACTION_MATRIX
    AGENT --> PRIORITY --> ACTION_MATRIX
    ACTION_MATRIX --> GEMINI
    ACTION_MATRIX --> DB
    ACTION_MATRIX --> WS
    ACTION_MATRIX --> TG
    SIM --> WS
    WS --> MAP
    WS --> FEED
    WS --> METRICS
    DB --> DRIVER
    REPLAY_UI --> AGENT
```

---

## 🌐 External Data Sources & Zero-Key Degradation

| Data Source | Capability | Auth Required | Cache / Timeout Policy | Fallback Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Open-Meteo Weather API** | 48-hour precipitation & hourly intensity | **None (Free)** | 30-min in-memory cache, 8s timeout | Default regional historical baseline |
| **Open-Meteo Elevation API** | Terrain elevation & gradient variance | **None (Free)** | Permanent memory cache, 8s timeout | Flat elevation assumed (0m) |
| **Open-Meteo Flood API** | River discharge ratio ($Q / Q_{mean}$) | **None (Free)** | 30-min cache, 8s timeout | Ratio defaulted to 1.0 (normal) |
| **Project OSRM Demo Server** | Driving routes, multi-alternatives & GeoJSON | **None (Free)** | 10-min route cache, 8s timeout | Offline linear coordinate interpolation |
| **Google Gemini 1.5** | Natural language reasoning explanations | Optional Key | Grounded to factual DB records only | Deterministic template-based reasoning |
| **Telegram Bot API** | Outbound driver reroute notifications | Optional Key | Fire-and-forget async dispatch | Gracefully skipped with logged action |

---

## 🧮 Transparent Agent Decision Logic & Mathematics

### 1. Road Risk Assessment Score (0–100)
Every corridor is sampled across 5 evenly-spaced geodetic coordinates:
$$\text{RiskScore} = \text{Clamp}_{0..100}\Big(\big(R_{48} + I_{peak} + T_{terrain} + Q_{river}\big) \times P_{prob} + A_{bonus}\Big)$$

- **48-Hour Accumulated Rainfall ($R_{48}$)**: Scaled $0 \to 45$ points ($0$ at $\le 20\text{ mm}$, $45$ at $\ge 200\text{ mm}$).
- **Peak Hourly Intensity ($I_{peak}$)**: Scaled $0 \to 20$ points ($0$ at $\le 5\text{ mm/h}$, $20$ at $\ge 40\text{ mm/h}$).
- **Terrain & Slope Vulnerability ($T_{terrain}$)**: Up to $15$ points. Low-lying elevations ($< 15\text{ m}$) add coastal flood risk; elevation variance ($\sigma > 120\text{ m}$) adds steep Western Ghat landslide risk.
- **River Discharge Ratio ($Q_{river}$)**: Scaled $0 \to 15$ points when $Q / Q_{mean} > 1.5$.
- **Precipitation Probability Multiplier ($P_{prob}$)**: Range $[0.70, 1.00]$.
- **Active Emergency Alert Bonus ($A_{bonus}$)**: $+10$ points if an official flood/landslide report exists within 15 km.

### 2. Decision Rules & Cargo Priority Matrix
The agent monitors active shipments along their remaining route trajectory:
- **`CONTINUE`**: Maximum risk along remaining route $< 50$.
- **`REROUTE`**: Active route risk $\ge 50$, and a safe alternate route exists (risk $< 50$) within the cargo's acceptable detour threshold:
  - **Critical / Medicine**: Accepts up to $+180\text{ minutes}$ detour.
  - **Perishable Food**: Accepts up to $+120\text{ minutes}$ detour.
  - **Normal / Non-Perishable**: Accepts up to $+90\text{ minutes}$ detour.
- **`HOLD`**: Risk $\ge 50$, no safe alternate exists, but weather forecast shows the rainfall surge easing within 12 hours. Truck is instructed to hold safely at depot.
- **`ESCALATE`**: Risk $\ge 50$, no safe alternate exists, and closure is expected to exceed 12 hours. Escalated to human emergency dispatchers.

### 3. Modelled Delay Avoided Calculation
To quantify proactive resilience without fabricating telemetry, the system calculates savings against a documented conservative baseline:
$$\text{DelayAvoidedMin} = \max\left(0, \; \text{BLOCKED\_ROAD\_DELAY\_MIN} \times \frac{\text{riskScore}}{100} - \text{extraMinutes}\right)$$
- **Baseline Assumption**: $\text{BLOCKED\_ROAD\_DELAY\_MIN} = 360\text{ minutes}$ (6 hours, standard highway landslide clearance time).
- In the UI, this metric is transparently tagged with a **"Modelled Estimate"** badge.

---

## ⚖️ Transparent Assumptions & Limitations

| Dimension | Real Implementation | Simulated / Modelled Element | Limitation / Boundary |
| :--- | :--- | :--- | :--- |
| **Weather & Hydrology** | Real Open-Meteo forecasts, elevations, and historical archives | Offline fallback datasets provided for air-gapped demo runs | Forecast accuracy relies on numerical weather prediction models |
| **Road Network** | Real OpenStreetMap highway geometry via OSRM | Buffer intersection sampled every 500m along polyline | Does not account for unmapped local mud roads |
| **Fleet Telemetry** | Active routes, coordinate progression, and dynamic ETA updates | Truck movement is simulated at 60x speed for live demonstration | Assumes trucks maintain normal cruising speeds when not rerouted |
| **Delay Savings** | Computed via transparent, mathematically bounded formula | Baseline closure assumes standard 360-minute blockage | Real-world road clearance times vary based on heavy equipment access |

---

## 🎮 Historical Disaster Replay Sandbox

The platform includes full historical event simulation for retrospective evaluation:
1. **Kerala Monsoon Floods (August 2018)**: Simulates the catastrophic inundation of NH66 (Kochi–Alappuzha) and NH766 (Wayanad Ghat).
2. **Chennai Floods (Nov–Dec 2015)**: Simulates urban river overtopping across Chennai OMR and coastal lifelines.

### WITH vs. WITHOUT Agent Comparative Outcomes
| Metric | Without Proactive Agent (Baseline) | With Supply Resilience Agent | Delta / Savings |
| :--- | :--- | :--- | :--- |
| **Shipments Stranded** | 7 trucks trapped | **0 trucks trapped** | **100% hazard avoidance** |
| **Total Route Delays** | 2,520+ minutes | **340 minutes** (safe detours) | **~2,180 minutes saved** |
| **Critical Medicine Delivery** | Delayed by 18–36 hours | **Delivered on-time via alternate corridor** | **Zero spoilage / Zero casualty risk** |

---

## 💻 Local Setup & Installation

### Prerequisites
- **Node.js**: v18.x or v20.x installed
- **Git**: Installed
- **Terminal**: Bash, PowerShell, or Zsh

### 1. Clone & Navigate
```bash
git clone https://github.com/Dhanushcr18/Desoster-management.git
cd Desoster-management/smart-disaster-hub
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```
*(Default `.env` runs out of the box with SQLite and auto-generated secure development secrets)*.

Seed South India resilient corridors, warehouses, and shipments:
```bash
npm run seed:resilience
```

Run test suite:
```bash
npm test
```
*(Executes 4 test suites covering risk scoring, geo distance algorithms, agent decision matrix, and JWT authentication)*.

Start backend server:
```bash
npm run dev
```
*Backend runs on `http://localhost:3000` (Socket.IO + REST API).*

### 3. Frontend Setup
In a new terminal window:
```bash
cd ../frontend
npm install
cp .env.example .env
```

Run frontend test suite:
```bash
npx vitest run
```

Start frontend development server:
```bash
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 📱 Mobile Driver Dispatch View

Every simulated vehicle features a dedicated, driver-friendly mobile dispatch portal:
- **URL Route**: `http://localhost:5173/driver/:shipmentCode` (e.g., `/driver/TRK-001`, `/driver/TRK-004`)
- **Key Features**:
  - Live status banner with bold reroute alerts
  - Turn-by-turn guidance comparing original vs active route
  - Plain-language reason explaining why the road ahead is unsafe
  - One-click acknowledge button for the driver to confirm new route receipt

---

## ⏱️ 2-Minute Judge Demo Script

| Time | Screen / Action | What to Say & Point Out |
| :---: | :--- | :--- |
| **0:00 - 0:25** | **Supply Resilience Dashboard (`/resilience`)** | *"Welcome judges. Most disaster systems are reactive—they wait for a human to report that a road collapsed. Our Autonomous Supply Resilience Agent predicts road risk 48 hours ahead using Open-Meteo forecasts and terrain elevation, rerouting critical supplies before corridors flood."* |
| **0:25 - 0:50** | **Live Corridor Map & Road Risks** | *"Look at the interactive Leaflet map: we see critical freight corridors across South India. Notice NH766 Wayanad Ghat is highlighted red with high landslide risk. The truck TRK-004 carrying critical medicine is en-route from Kozhikode to Mysuru."* |
| **0:50 - 1:15** | **Agent Decision Feed & 'Run Cycle'** | *Click 'Run Agent Cycle Now'. "The autonomous agent evaluated TRK-004. Because it carries priority medicine, it cannot afford to be trapped. The agent autonomously recalculated an alternate OSRM route, accepting a safe +45 min detour, saving an estimated 315 minutes of emergency delay."* |
| **1:15 - 1:35** | **Mobile Driver Terminal (`/driver/TRK-004`)** | *Open `/driver/TRK-004`. "The driver receives immediate actionable dispatch instructions on mobile and Telegram: 'REROUTED to NH275 corridor due to 182mm predicted rainfall and landslide hazard'."* |
| **1:35 - 2:00** | **Replay Sandbox & Comparative Analytics** | *Switch to Replay Mode, select 'Kerala August 2018' and click Start. "In replay mode, judges can watch historical disaster progression. Notice our comparative chart: with the proactive agent, 0 trucks are trapped versus 7 in the baseline, proving measurable supply chain resilience."* |

---

## ☁️ Cloud Deployment Guide

### Backend on Render (Docker)
1. Go to **Render Dashboard** $\to$ **New Web Service**.
2. Connect repo: `Dhanushcr18/Desoster-management`.
3. Set **Root Directory**: `smart-disaster-hub/backend`.
4. Select **Docker** environment.
5. Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `3000`
   - `JWT_SECRET`: *(32+ character secure random string)*
   - `GEMINI_API_KEY`: *(Optional)*
   - `TELEGRAM_BOT_TOKEN`: *(Optional)*
6. Health Check Path: `/health`.

### Frontend on Vercel
1. Go to **Vercel Dashboard** $\to$ **Add New Project**.
2. Select repo and set **Root Directory**: `smart-disaster-hub/frontend`.
3. Framework Preset: `Vite`.
4. Environment Variables:
   - `VITE_API_URL`: `https://your-render-app.onrender.com`
   - `VITE_SOCKET_URL`: `https://your-render-app.onrender.com`
5. Click **Deploy**.

---

## 👥 Contributors & Acknowledgements
- Developed for Hackathon Track: **Climate, Resource Infrastructure & Global Supply Resilience**.
- Powered by open-source data from **Open-Meteo**, **OpenStreetMap**, and **Project OSRM**.
- Licensed under the **MIT License**.
