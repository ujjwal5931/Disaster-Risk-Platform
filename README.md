# Purva Drishti — Disaster Risk Intelligence Platform
## Smart India Hackathon 2026 — Problem Statement SIH26191

**Intelligent Identification of Hazard-Based Red Zones, Carrying Capacity Assessment, and Immediate Relocation Needs for Vulnerable Habitations**

> ⚠️ **DEMO MODE** — All data is synthetic and for demonstration only. Not for operational use.

---

## Quick Start

### Prerequisites
- Python 3.x (any version — no pip dependencies required)
- Node.js 18+

### Start Backend API (Terminal 1)
```bash
cd disaster-risk-platform/backend
python3 server.py
```
Server runs at: **http://localhost:8000**

### Start Frontend (Terminal 2)
```bash
cd disaster-risk-platform/frontend
npm install   # first time only
npm run dev
```
App runs at: **http://localhost:5173**

---

## Login Credentials

| Username | Password    | Role    | Access Level |
|----------|-------------|---------|--------------|
| admin    | admin123    | Admin   | Full access  |
| officer  | officer123  | Officer | Full access  |
| viewer   | viewer123   | Viewer  | Read-only    |

---

## Features

### 🗺️ GIS Risk Map
- Interactive Leaflet map centered on India
- 50 habitation markers colored by risk level (Green → Red)
- 10 red zone polygons with hazard overlays
- 10 safe zone markers with capacity info
- Layer toggles and risk-level filters

### 📊 Dashboard
- 6 KPI cards: total habitations, high risk, critical, capacity exceeded, P1 relocation, population at risk
- Risk distribution pie chart
- Hazard type bar chart
- Top 10 priority habitations table
- Recent alerts panel

### ⚡ What-If Simulation
- Select any habitation
- 5 preset scenarios: 20% Rainfall, Major Flood, Population Surge, +100% Shelter, Worst Case
- 6 adjustable parameters: Population Change, Rainfall Multiplier, Flood Level, Shelter Capacity, Healthcare Capacity, Road Availability
- Before/after comparison table with colored delta indicators
- Automatic risk escalation detection

### 🔴 Red Zones
- 10 hazard zones across India
- Risk score, population exposed, polygon coordinates
- Slide-in detail panel

### 📏 Carrying Capacity
- 7-dimension assessment: Water, Shelter, Healthcare, Road, Food, Sanitation, Safe Land
- Per-habitation radial bar charts
- Status badges: SAFE / STRESSED / OVERLOADED / CRITICAL

### 🚐 Relocation Planning
- Priority-filtered habitation list (P1/P2/P3/P4)
- Nearest safe zone recommendations with haversine distance
- Safe zone details: capacity, safety score, healthcare/road/water access

### 📈 Population Vulnerability
- Aggregate vulnerable population analysis
- Demographic breakdown charts (children, elderly, disabled, pregnant)
- Stacked bar chart for top habitations

### 📋 Reports
- Individual habitation reports with all fields
- Regional summary report with top 15 at-risk habitations
- Print/PDF support (window.print())

### 📤 Data Upload
- Drag-and-drop CSV/JSON/GeoJSON upload
- Column validation against required schema
- CSV preview table (first 5 rows)
- Template CSV download

---

## Architecture

```
disaster-risk-platform/
├── backend/
│   ├── server.py           ← Pure Python 3 HTTP server (no dependencies)
│   ├── app/
│   │   ├── core/auth.py    ← Mock base64 JWT tokens
│   │   ├── data/seed.py    ← 50 habitations + 10 red zones + 10 safe zones
│   │   ├── database.py     ← SQLite helpers
│   │   └── services/
│   │       ├── risk_engine.py        ← 7-factor weighted risk scoring
│   │       ├── capacity_engine.py    ← 7-dimension carrying capacity
│   │       ├── relocation_engine.py  ← Priority + safe zone ranking
│   │       └── simulation_engine.py  ← What-if scenario analysis
└── frontend/
    ├── src/
    │   ├── pages/          ← 16 full pages
    │   ├── components/     ← Layout + UI components
    │   ├── data/seedData.ts← 50 habitations (client-side offline mode)
    │   ├── types/          ← TypeScript interfaces
    │   └── store/          ← Zustand state management
    └── dist/               ← Production build output
```

## Risk Scoring Model

The platform uses a transparent, weighted rule-based scoring model:

| Factor | Weight |
|--------|--------|
| Hazard Severity | 25% |
| Population Exposure | 20% |
| Vulnerable Population | 15% |
| Infrastructure Vulnerability | 15% |
| Historical Frequency | 10% |
| Emergency Accessibility | 10% |
| Environmental Sensitivity | 5% |

Risk Classes: `LOW (0–24)` | `MODERATE (25–49)` | `HIGH (50–74)` | `CRITICAL (75–100)`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Platform summary stats |
| GET | `/api/habitations` | All 50 habitations |
| GET | `/api/habitations/{id}` | Detailed habitation + risk + capacity + relocation |
| GET | `/api/habitations/map-data` | Lightweight map markers |
| GET | `/api/risk-map` | Risk data for all habitations |
| GET | `/api/red-zones` | 10 red zones with polygon coords |
| GET | `/api/safe-zones` | 10 safe zones |
| GET | `/api/capacity` | Capacity summary for all habitations |
| GET | `/api/capacity/{id}` | 7-dimension capacity for one habitation |
| GET | `/api/relocation` | Relocation priority list |
| GET | `/api/relocation/{id}` | Relocation detail + safe zone ranking |
| GET | `/api/alerts` | System alerts sorted by severity |
| GET | `/api/hazards` | Historical hazard events |
| POST | `/api/simulate` | What-if simulation |
| POST | `/api/auth/login` | Authentication |
| POST | `/api/reports` | Generate report |
| POST | `/api/upload-data` | Validate uploaded data |

---

## Seed Data Coverage

| Group | Count | Region | Hazard |
|-------|-------|--------|--------|
| Flood-prone | 12 | UP / Bihar | Flood |
| Landslide-prone | 8 | Uttarakhand / HP | Landslide |
| Coastal / Cyclone | 8 | Odisha / WB / Andhra | Cyclone |
| Drought-prone | 7 | Rajasthan / Maharashtra | Drought |
| Urban Fringe | 7 | NCR / Mumbai | Industrial |
| Safe Inland | 8 | Madhya Pradesh | None (LOW risk) |
| **Total** | **50** | **Pan-India** | **8 hazard types** |

---

## Official Disclaimer

This platform is a **prototype decision-support system** developed for demonstration purposes. Risk classifications, carrying capacity assessments, and relocation recommendations shown are based on synthetic data and simplified rule-based models. They **must not be used for operational decisions** without:
- Verification against official geospatial and field survey data
- Validation by qualified disaster management authorities
- Integration with real-time meteorological and hydrological data

Category: Disaster Management | Smart India Hackathon 2026 | Problem SIH26191
