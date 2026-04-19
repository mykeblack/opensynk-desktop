# OpenSynk Desktop

OpenSynk Desktop is an open-source desktop application for monitoring and managing Sunsynk-based solar, battery, and home energy systems.

## Features

- Live solar generation monitoring
- Battery state of charge monitoring
- Grid import/export tracking
- Historical charts and trends
- Tariff-aware insights
- Optional advanced inverter controls
- Local-first architecture

## Tech Stack

- Frontend: React + TypeScript + Tailwind
- Backend: FastAPI + SQLite
- Desktop Wrapper: Tauri

## Repository Structure

```text
opensynk-desktop/
├─ apps/
│  ├─ desktop/
│  ├─ web/
│  └─ backend/
├─ docs/
├─ examples/
├─ .github/
├─ LICENSE
└─ README.md
```

## Development

### Frontend
```bash
cd apps/web
npm install
npm run dev
```

### Backend
```bash
cd apps/backend
python -m venv .venv
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Desktop
```bash
cd apps/desktop
npm install
npm run tauri dev
```
