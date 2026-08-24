# AI-smart-vaccine-cold-chain-monitor
# ECHELON — AI-Based Vaccine Cold-Chain Monitoring System

**Smart India Hackathon 2026 Submission**

ECHELON is an end-to-end IoT + AI system that monitors vaccine storage and transport conditions in real time, predicts cold-chain failure risk before it happens, and alerts stakeholders instantly — protecting vaccine potency, reducing wastage, and ensuring public health safety.

---

## 🚀 Problem Statement

Vaccines are highly temperature-sensitive. A break in the cold chain — even for a short period — can silently degrade vaccine potency, leading to reduced immunization effectiveness and significant wastage. Manual monitoring is slow, error-prone, and often detects failures only after the damage is done.

## 💡 Solution

ECHELON continuously senses environmental conditions inside storage and transport units, processes data at the edge for offline resilience, and uses AI to detect anomalies and predict risk — before a critical breach occurs — with real-time alerts and full compliance reporting.

---

## 🏗️ System Architecture

```
Sensor → Edge Device → Local Storage → Cloud Platform → AI Engine → Risk Classification
                                                                          │
                        ┌─────────────────────────────────────────────────┤
                        ▼                 ▼                ▼              ▼
                  Dashboard          Alert System   Transport Monitoring  Batch Mgmt
                        │                 │                │              │
                        └─────────────────┴────────────────┴──────────────┘
                                          ▼
                              Reports & Compliance → Users → Action & Decision
```

### Pipeline Stages

| # | Module | Description |
|---|--------|-------------|
| 1 | **Environmental Sensing** | SHT33 sensor captures high-accuracy temperature (°C) and humidity (%) inside the vaccine storage/transport unit |
| 2 | **Edge Device Processing** | Raspberry Pi reads sensor data, validates/preprocesses it, timestamps, applies local decision rules, encrypts, and manages connectivity |
| 3 | **Local Storage (Offline Support)** | Buffers data locally with zero data loss when offline; auto-syncs to the cloud once connectivity returns |
| 4 | **Cloud Platform** | Real-time data ingestion, secure encrypted storage, device management, scalable and reliable |
| 5 | **AI Engine / Analytics** | Anomaly detection, trend analysis, rate-of-change monitoring, prolonged exposure checks, cold-chain failure prediction, risk score generation |
| 6 | **Risk Assessment & Classification** | AI-based risk score (0–100): 🟢 Safe (0–30) · 🟡 Warning (31–70) · 🔴 Critical (71–100) |
| 7 | **Smart Dashboard** | Live temp/humidity, historical graphs, risk score & status, device/transport overview, alerts, vaccine/batch details |
| 8 | **Intelligent Alert System** | Instant multi-channel notifications (SMS, email, WhatsApp, push) with severity levels and recommended actions |
| 9 | **Transport Monitoring** | Real-time GPS tracking, journey tracking, cold-chain status in transit, handover/arrival condition |
| 10 | **Vaccine & Batch Management** | Vaccine type & batch details, quantity tracking, storage/transport mapping, exposure history, current risk status |
| 11 | **Reports & Compliance** | Temperature excursion reports, exposure duration reports, journey reports, audit logs, PDF/CSV export |
| 12 | **Users** | Role-based access — Healthcare Worker, Transport Personnel, Administrator |
| 13 | **Action & Decision** | Review alerts → assess risk → take corrective action → ensure vaccine safety (closed-loop monitoring) |

---

## ✨ Key Features

- Real-time monitoring with high-accuracy SHT33 sensors
- AI-powered risk prediction and early warning
- Offline data logging with automatic synchronization
- Live transport monitoring with GPS tracking
- Multi-channel smart alerts (SMS/email/WhatsApp/push)
- Vaccine & batch-level tracking
- Detailed reports and compliance export
- Secure, reliable, and scalable architecture

## 🎯 Key Benefits

- Maintains vaccine potency
- Prevents wastage
- Ensures public health safety
- Early detection of cold-chain breaches
- Data-driven decision making
- Improves supply chain reliability
- Supports immunization programs at scale

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Edge / IoT** | Raspberry Pi, SHT33 sensor (I2C), Python |
| **Backend / Cloud** | FastAPI (Python) / Node.js, MQTT or HTTPS ingestion |
| **Database** | PostgreSQL / TimescaleDB (time-series sensor data) |
| **AI Engine** | Python — scikit-learn / statsmodels for anomaly detection & risk scoring |
| **Frontend** | React + Tailwind CSS |
| **Charts** | Recharts / Chart.js |
| **Maps / GPS** | Leaflet / Mapbox |
| **Alerts** | Twilio (SMS/WhatsApp), SendGrid (Email), Firebase (Push) |
| **Reports** | WeasyPrint / pdfkit (PDF), CSV export |

---

## 📂 Project Structure

```
echelon/
├── edge/                  # Raspberry Pi sensor + local buffering scripts
│   ├── sensor_reader.py
│   ├── local_store.py
│   └── sync_client.py
├── backend/                # Cloud API & AI engine
│   ├── app/
│   │   ├── api/            # Ingestion & CRUD endpoints
│   │   ├── ai_engine/       # Risk scoring & anomaly detection
│   │   ├── alerts/          # Notification service
│   │   └── reports/         # PDF/CSV report generation
│   └── requirements.txt
├── frontend/                # React dashboard
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- Raspberry Pi (or simulated sensor mode for local dev)

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Edge Device Setup (Raspberry Pi)
```bash
cd edge
pip install -r requirements.txt
python sensor_reader.py
```

> For local development without physical hardware, enable simulated sensor mode in `edge/sensor_reader.py` to generate synthetic temperature/humidity data.

---

## 👥 Team ECHELON

Built for **Smart India Hackathon 2026**.

---

## 📄 License

This project is submitted as part of Smart India Hackathon 2026. License details to be added.
