# Nex Guard — Edge AI-Based Elderly Fall Detection & Emergency Assistance

Nex Guard is a privacy-first wearable elderly fall detection and emergency assistance system. It performs local sensor window processing and TinyML 1D CNN fall classification directly on an ESP32-S3 wearable, broadcasting real-time emergency notifications over Wi-Fi/GSM to a FastAPI backend, PostgreSQL database, and React Native Expo caregiver app.

---

## 1. System Architecture

```text
                    ┌─────────────────────────┐
                    │      ESP32-S3           │
                    │                         │
                    │ MPU6050 (Accel/Gyro)    │
                    │ BMP390 (Pressure/Alt)   │
                    │ NEO-6M GNSS / GPS       │
                    │ Active Buzzer           │
                    │ Vibration Motor         │
                    │ Cancel Button           │
                    │ SIM800L GSM Fallback    │
                    │                         │
                    │ Sensor processing       │
                    │ TinyML 1D CNN Inference │
                    │ Fall State Machine      │
                    └────────────┬────────────┘
                                 │
                         Wi-Fi / GSM (HTTPS / WS)
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │       FastAPI           │
                    │                         │
                    │ REST API & Auth (JWT)   │
                    │ Device & Telemetry      │
                    │ Fall Events & Alerts    │
                    │ WebSocket Broadcaster   │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │ PostgreSQL / SQLite     │
                    │                         │
                    │ Users & Caregivers      │
                    │ Devices & Telemetry     │
                    │ Fall Events & Alerts    │
                    └────────────┬────────────┘
                                 │
                           REST / WebSocket
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │ React Native + Expo     │
                    │                         │
                    │ Caregiver Dashboard     │
                    │ Real-time Emergency Alert│
                    │ Acknowledge & Resolve   │
                    │ History & Device Health │
                    └─────────────────────────┘
```

---

## 2. Fall Detection Workflow & State Machine

```text
NORMAL
  │
  ▼
POSSIBLE_FALL (Motion gate threshold >= 2.5g)
  │
  ▼
USER_CONFIRMATION (TinyML 1D CNN score >= 0.70)
  ├── Cancel Button Pressed ──> CANCELLED ──> NORMAL
  │
  └── Timeout (15s) ──> CONFIRMED_FALL
                              │
                           LOCATING (GNSS Fix)
                              │
                           ALERTING (HTTP / WebSocket)
                              │
                        CAREGIVER APP (Real-time Alert)
                              │
                        ACKNOWLEDGED
                              │
                          RESOLVED
```

---

## 3. Quick Start & Component Setup

### Prerequisites
- Python 3.12+
- Node.js 18+ & npm
- Expo CLI
- Docker & Docker Compose (Optional for containerized PostgreSQL)

---

### Backend Setup

From the `backend` folder:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m pytest
```

Start backend API server:

```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

API available at `http://localhost:8000`. Verify status:

```powershell
Invoke-RestMethod http://localhost:8000/health
```

---

### Mobile App Setup

From the `mobile` folder:

```powershell
cd mobile
npm install
npm run typecheck
$env:EXPO_PUBLIC_API_URL = "http://localhost:8000"
npm run start
```

---

### TinyML Pipeline & Model Training

To train the 1D CNN model, evaluate performance against AdaBoost, and export the C header model for ESP32 firmware:

```powershell
backend\.venv\Scripts\python -m ml.evaluate
```

Output generated:
- `firmware/include/fall_detection_model.h` (C Header quantized weights)
- `ml/model_report.md` (Precision, Recall, F1, Latency, and Real-world validation status)

---

### Firmware Simulation & End-to-End Pipeline Verification

To execute the complete end-to-end simulated workflow (ESP32 State Machine -> TinyML Fall -> FastAPI -> DB -> WebSocket -> Caregiver Acknowledge & Resolve):

```powershell
backend\.venv\Scripts\python test_e2e_simulation.py
```

---

## 4. Hardware Wiring Table (ESP32-S3)

| Component | Pin | ESP32-S3 GPIO | Interface | Operating Voltage | Notes |
|---|---|---|---|---|---|
| **MPU6050** | SDA / SCL | **GPIO8 / GPIO9** | I2C (`0x68`) | 3.3 V | 6-axis IMU |
| **BMP390** | SDA / SCL | **GPIO8 / GPIO9** | I2C (`0x76`) | 3.3 V | Barometric Altitude |
| **GPS (NEO-6M)** | TX / RX | **GPIO18 / GPIO17** | UART1 | 3.3 V | GNSS Location |
| **Vibration Motor** | Gate | **GPIO5** | Digital Out | 3.3 V | AO3400A N-MOSFET |
| **Active Buzzer** | Base | **GPIO6** | Digital Out | 3.3 V | 2N3904 Transistor |
| **Cancel Button** | Terminal 1 | **GPIO4** | `INPUT_PULLUP` | 3.3 V | Active Low |
| **Battery ADC** | Divider | **GPIO1** | ADC1_CH0 | 0 - 2.1 V | 1:1 100 kΩ Divider |

For detailed electrical specifications, decoupling capacitors, and bring-up order, see [docs/hardware.md](file:///d:/CODE/Projects/Nex%20Guard/docs/hardware.md).

---

## 5. API Reference Summary

- `GET /health`: System status
- `POST /api/v1/auth/register`: Caregiver registration & JWT token
- `POST /api/v1/auth/login`: Caregiver authentication
- `POST /api/v1/devices/register`: Wearable device pairing
- `POST /api/v1/devices/{device_id}/heartbeat`: Device heartbeat & battery level
- `POST /api/v1/events/fall`: Fall event submission & alert generation
- `GET /api/v1/alerts`: List active and historic alerts
- `POST /api/v1/alerts/{alert_id}/acknowledge`: Acknowledge emergency alert
- `POST /api/v1/alerts/{alert_id}/resolve`: Resolve emergency alert
- `WebSocket /api/v1/ws`: Real-time event broadcasting

---

## 6. Standalone Local Mode vs Optional Remote Mode

Nex Guard supports dual operational modes:

### Local Mode (Default Standalone Architecture)
- **Engine**: SQLite (`nex_guard.db`) + `expo-secure-store` + `expo-crypto` per-user SHA-256 salt.
- **Capabilities**: Local authentication, profile management, device registration, local fall event state machine, local emergency notifications, and local alert history.
- **Connectivity**: **100% Offline** (No FastAPI, PostgreSQL, Docker, Wi-Fi, or mobile data required).

### Optional Remote Mode (Future Cloud Synchronization)
- **Engine**: FastAPI REST API + PostgreSQL + WebSocket broadcaster (`/api/v1/ws`).
- **Capabilities**: Remote telemetry storage, multi-caregiver remote push notifications, cloud sync.
- **Boundary**: Isolated under `RemoteAuthService` and remote API adapters.

### Hardware & Simulation Distinctions
1. **Local Fall Simulation**:
   - In-app local test engine (`TRIGGER LOCAL FALL SIMULATION`).
   - Executes deterministic local state machine (`NORMAL` → `POSSIBLE_FALL` → `USER_CONFIRMATION` [20s window] → `CANCELLED` or `CONFIRMED_FALL` → `GPS_LOCATION` → `LOCAL_ALERT` → `ACKNOWLEDGED` → `RESOLVED`).
   - Clearly tagged with source `LOCAL SIMULATION` in SQLite database and UI screens.
   - Triggers high-priority local Android notifications using `expo-notifications`.
2. **Real Hardware Fall Detection**:
   - ESP32-S3 wearable micro-controller equipped with physical MPU6050 6-axis IMU, BMP390 barometric altitude sensor, NEO-6M GNSS GPS module, SIM800L GSM module, active buzzer, vibration motor, and physical cancel button.
   - Runs local 1D CNN TinyML model directly on ESP32-S3 hardware.
3. **Remote Caregiver Alert**:
   - Optional push notification & cloud synchronization infrastructure over FastAPI REST / WebSockets.


