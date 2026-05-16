# Bioelectric AI — Clinical Frontend

> **React + Three.js clinical dashboard** for real-time 3D cardiac source localization, multi-lead ECG monitoring, and physics-parameter-driven simulation — designed for physician use.

---

## Overview

The frontend connects to the FastAPI backend via a persistent WebSocket, receiving synthesized cardiac signals at 20 Hz. It renders:

- A **3D heart model** with a map-pin marker showing the localized cardiac activation source in real time
- **Multi-lead ECG canvases** drawn at clinical paper speed (25 mm/s, 10 mm/mV)
- **Physics parameter sliders** that modulate the Aliev-Panfilov model on the server in real time
- A **clinical vitals strip** (HR, QRS, PR, QTc, AI confidence)
- An **Educational Lab** with interactive clinical scenarios (STEMI, VT, AF, bradycardia)

---

## Application Structure

```
                    ┌──────────────────────────────────────┐
                    │         React 18 + Vite               │
                    │   React Router v7 (SPA, hash-free)    │
                    └──────────────────┬───────────────────┘
                                       │
                    ┌──────────────────▼───────────────────┐
                    │          Context Layer                 │
                    │                                       │
                    │  AuthContext     — JWT + user session │
                    │  StreamContext   — WebSocket 20Hz     │
                    │  PatientContext  — selected patient   │
                    │  ThemeContext    — dark / light mode  │
                    │  LanguageContext — i18n (EN/TH)       │
                    │  ToastContext    — notification queue │
                    └──────────────────┬───────────────────┘
                                       │
          ┌────────────────────────────▼───────────────────────────────┐
          │                        Pages                                │
          │  /page/overview      PatientList      — patient roster     │
          │  /page/live          LiveMonitoring   — primary clinical UI │
          │  /page/lab           EducationalLab   — PINN + 3D sandbox  │
          │  /page/ai-diagnostics AIDiagnostics   — model explainability│
          │  /page/brain-diagnostics BrainDiagnostics — EEG / neural   │
          │  /page/analysis      Analysis         — batch ECG review   │
          │  /page/reports       Reports          — aggregate stats    │
          │  /page/archives      PatientArchives  — session history    │
          │  /page/sandbox       NeuralSandbox    — raw PINN interface │
          │  /page/help          HelpManual       — user guide         │
          └────────────────────────────────────────────────────────────┘
```

---

## Key Components

### `HeartModel3D` ([src/components/visualizers/HeartModel3D.jsx](src/components/visualizers/HeartModel3D.jsx))

Renders the 3D heart model using React Three Fiber + Three.js.

```
Canvas (React Three Fiber)
  ├── Heart (GLB model at /models/heart.glb)
  │     Natural mesh colors preserved
  │     QRS glow pulse: emissiveIntensity 0.18 → 0.73, decays at 3.5/s
  │     Heartbeat scale animation: ±2.2% at 1.2 Hz
  │
  ├── PinMarker (map-pin style localization marker)
  │     Position: lerp to target at 0.06/frame (smooth interpolation)
  │     Rings: ringGeometry depthTest=false (always visible through heart)
  │     Stick + sphere head
  │     Html label (drei): region, mm coordinates, risk level, AI%
  │
  ├── ColorLegend (bottom-left overlay)
  └── OrbitControls (autoRotate 0.5 rpm, zoom 2–8 units)
```

**Risk classification from 3D coordinates:**

| Region | Risk |
|--------|------|
| Anterior wall / Interventricular Septum | HIGH |
| Inferior / Lateral wall | MODERATE |
| Outflow tracts / Apex | LOW |

Risk color: `#ef4444` HIGH · `#f59e0b` MODERATE · `#22c55e` LOW

**Coordinate mapping:** Backend sends normalized [0,1] XYZ. Frontend maps to GLB bounding box via `mn + coord × (mx − mn)`.

---

### `ECGCanvas` ([src/components/visualizers/ECGCanvas.jsx](src/components/visualizers/ECGCanvas.jsx))

Canvas-based real-time ECG waveform renderer.

- **Buffer**: 200 points = 10 seconds at 20 Hz
- **Step**: `width / (points.length − 1)` — waveform always spans full canvas width from first sample
- **Grid**: ECG paper standard — minor 20px, major 100px (5mm × 5 squares)
- **Isoelectric baseline**: dashed line at canvas midpoint
- **Rendering**: glow pass (lineWidth=4, `color+'40'`) + main line (lineWidth=1.8) + live cursor dot at tip
- **leadKey prop**: subscribes directly to 20Hz `EventTarget` events (bypasses React state)
- **Canvas annotation**: "25 mm/s · 10 mm/mV"
- **Placeholder**: "Acquiring signal…" until ≥2 points buffered

---

### `PhysicsControlPanel` ([src/components/visualizers/PhysicsControlPanel.jsx](src/components/visualizers/PhysicsControlPanel.jsx))

Interactive slider panel for Aliev-Panfilov physics parameters. Changes are sent to the backend immediately via WebSocket (`sendUpdate({ type: 'parameter_update', params })`), modulating the ECG synthesis in real time.

| Slider | Parameter | Clinical meaning | Normal range |
|--------|-----------|-----------------|--------------|
| Ischemia Level | `a` | Excitation threshold — elevated in ischemia | 0.05–0.15 |
| Contractility | `k` | AP amplitude / ventricular force generation | 7.0–10.0 |
| Conduction Speed | `D` | Tissue diffusivity / intercellular propagation | 7×10⁻⁵–1.5×10⁻⁴ |

Each slider shows:
- Green zone overlay marking the physiological normal range
- ABNORMAL badge when value is outside normal range
- Live HR (BPM) and QTc from the stream at the top of the panel

---

## StreamContext Architecture ([src/context/StreamContext.jsx](src/context/StreamContext.jsx))

The WebSocket connection is managed globally as a single persistent connection:

```
WebSocket ws://localhost:8000/api/v1/ws/signals
     │  20 Hz frames
     ▼
StreamContext (provider wraps entire app)
     │
     ├── EventTarget (streamEvents) ← 20Hz, zero-copy
     │     └── ECGCanvas, HeartModel3D subscribe directly
     │           addEventListener('data', handler)
     │
     └── React state (setData) ← throttled 10Hz (100ms)
           └── PhysicsControlPanel, vitals strip, metric cards
```

**Why dual-frequency:** React state updates trigger re-renders (expensive at 20Hz). High-frequency consumers like ECG canvases and 3D position lerp use `EventTarget` directly to avoid frame drops. Metric displays and parameter panels use throttled React state.

**Auto-reconnect:** `socket.onclose` schedules `connect()` after 3 seconds. On reconnect, re-subscribes to the current patient ID.

---

## Authentication ([src/context/AuthContext.jsx](src/context/AuthContext.jsx))

- JWT stored in `localStorage` under `bio_token`
- Validated on every page load by decoding `payload = JSON.parse(atob(token.split('.')[1]))` and checking `payload.exp * 1000 < Date.now()`
- Expired or malformed tokens are cleared immediately (prevents 401 spam to the server)
- Login calls `POST /api/v1/auth/login` (OAuth2 form), receives JWT, sets state + localStorage
- `ProtectedRoute` redirects to `/auth/login` if no valid token

---

## Pages

### `LiveMonitoring` ([src/pages/LiveMonitoring.jsx](src/pages/LiveMonitoring.jsx))

Primary clinical monitoring page. Shows:
- Connection status pill (live latency / offline)
- Metric cards: HR, QRS duration, axis, rhythm classification
- 3D heart model with localization pin
- Multi-lead ECG canvases (Lead I, II, V5)
- Event log (AI alerts, arrhythmia detections)
- Recording mode: captures lead buffers → saves to archive

### `EducationalLab` ([src/pages/EducationalLab.jsx](src/pages/EducationalLab.jsx))

Interactive physics education interface. Layout (top to bottom):
1. **3D Cardiac Source Localization** — HeartModel3D with real-time pin
2. **Live Vital Signs strip** — VitalCard components (HR, QRS, PR, QTc, AI)
3. **ECG Monitor** — ECGCanvas for Lead I, II, V5
4. **Left panel**: PhysicsControlPanel (parameter sliders)
5. **Bottom**: Clinical Scenarios — preset buttons that activate pathological parameter sets

**Scenario presets** (activates via `POST /api/v1/scenarios/activate`):
- Normal Sinus — baseline parameters
- STEMI — `a=0.35` (high ischemia), ST elevation pattern
- Ventricular Tachycardia — `k=2.5`, `D=0.0003` (fast conduction)
- Atrial Fibrillation — irregular R-R intervals
- Bradycardia / Tachycardia — heart rate modulation

### `AIDiagnostics` ([src/pages/AIDiagnostics.jsx](src/pages/AIDiagnostics.jsx))

Model explainability panel. Shows:
- EP-PINN model profile (hidden layers, physics constraints, training loss)
- Training metrics: Adam loss → L-BFGS loss (1.52 → 0.025, 98% reduction)
- Physics residual bar chart (PDE residual distribution)
- ECG comparison: predicted vs observed waveform side-by-side

### `BrainDiagnostics` ([src/pages/BrainDiagnostics.jsx](src/pages/BrainDiagnostics.jsx))

EEG / neural source localization interface with 3D brain model. Mirrors the cardiac flow but for EEG signals and neural dipole localization.

---

## Routing

All routes are protected (require valid JWT). Route structure in [src/App.jsx](src/App.jsx):

```
/auth/login          — public (Login page)
/*                   — ProtectedRoute → MainLayout
  /page/overview     — PatientList
  /page/live         — LiveMonitoring
  /page/lab          — EducationalLab
  /page/ai-diagnostics — AIDiagnostics
  /page/brain-diagnostics — BrainDiagnostics
  /page/analysis     — Analysis
  /page/reports      — Reports
  /page/archives     — PatientArchives
  /page/sandbox      — NeuralSandbox
  /page/help         — HelpManual
```

---

## Environment Variables

Create `.env.local` in the `web/` directory:

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/api/v1/ws/signals
```

In production, these point to the deployed backend URL.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server (hot reload)
npm run dev
# → http://localhost:5173

# 3. Build for production
npm run build

# 4. Preview production build
npm run preview

# 5. Lint
npm run lint
```

---

## Tech Stack

| Package | Version | Purpose |
|---------|---------|---------|
| React | 18.2 | UI framework |
| Vite | 8.x | Build tool + dev server |
| React Three Fiber | 8.x | Three.js declarative wrapper |
| @react-three/drei | 9.x | Three.js helpers (OrbitControls, Html, useGLTF) |
| Three.js | 0.163 | 3D rendering engine |
| Framer Motion | 11.x | Animation primitives |
| Lucide React | 0.363 | Icon set |
| Recharts | 2.x | Chart components (reports) |
| React Router | 7.x | Client-side routing |
| Tailwind CSS | 3.4 | Utility-first styling |
| Axios | 1.6 | REST API client |

---

## Deployment

The frontend is deployed to **Vercel** (`bioelectric-five.vercel.app`). The backend URL is set via Vercel environment variables (`VITE_API_URL`, `VITE_WS_URL`).

```bash
# Deploy via Vercel CLI
npx vercel --prod
```

---

## References

- React Three Fiber docs: [docs.pmnd.rs/react-three-fiber](https://docs.pmnd.rs/react-three-fiber)
- @react-three/drei: [github.com/pmndrs/drei](https://github.com/pmndrs/drei)
- Aliev, R.R. & Panfilov, A.V. (1996). A simple two-variable model of cardiac excitation. *Chaos, Solitons & Fractals*, 7(3), 293–301.
