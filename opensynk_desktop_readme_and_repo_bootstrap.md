# OpenSynk Desktop

An open-source desktop dashboard for monitoring and managing Sunsynk-based home energy systems.

---

## Repository Name

Recommended repository name:

`opensynk-desktop`

Alternative options:

- `opensynk-monitor`
- `opensynk-dashboard`
- `opensynk-console`
- `opensynk-ui`
- `opensynk-control-center`
- `opensynk-home-energy`
- `sunsynk-dashboard-oss`

---

# README.md

```md
# OpenSynk Desktop

OpenSynk Desktop is an open-source desktop application for monitoring and managing Sunsynk-based solar, battery, and home energy systems.

It provides a modern local-first desktop UI with live energy monitoring, historical charts, tariff insights, alerts, and optional advanced inverter controls.

## Features

### Monitoring
- Live solar generation
- Live battery state of charge
- Home load monitoring
- Grid import and export monitoring
- Daily generation and consumption totals
- Historical charts for 24h / 7d / 30d
- Multiple inverter and site support

### Insights
- Import/export tariff support
- Estimated daily energy cost
- Battery charging recommendations
- Off-peak charging windows
- Solar self-consumption tracking
- Alerts for low battery, high import, inverter offline, and more

### Optional Advanced Controls
- Battery reserve target
- Charge/discharge windows
- Inverter mode presets
- Export limit settings
- Write action confirmation flow
- Local audit log of all changes

## Goals

- Provide a better user experience than the official Sunsynk app
- Be easy to install and use without Home Assistant
- Keep all credentials and tokens local to the user's machine
- Default to read-only mode
- Treat inverter controls as advanced and optional
- Stay local-first with no OpenSynk cloud service required

## Not Affiliated with Sunsynk

OpenSynk Desktop is an independent community project.

It is not affiliated with, endorsed by, or maintained by Sunsynk.

All Sunsynk trademarks, logos, and product names remain the property of their respective owners.

## Safety Notice

Changing inverter settings may affect:

- Battery lifespan
- Backup reserve capacity
- Grid import/export behavior
- Energy costs
- Time-of-use schedules

Read-only mode is enabled by default.

Advanced write controls should only be used if you understand your inverter setup and the effect of each setting.

## Planned Screens

- Dashboard
- Live Energy Flow
- History & Charts
- Battery View
- Tariffs & Savings
- Alerts
- Settings
- Advanced Controls

## Technology Stack

### Frontend
- React
- TypeScript
- Tailwind
- Zustand
- TanStack Query
- Recharts

### Backend
- FastAPI
- SQLAlchemy
- SQLite
- APScheduler
- Pydantic

### Desktop
- Tauri

## Project Structure

```text
opensynk-desktop/
├─ apps/
│  ├─ desktop/
│  ├─ web/
│  └─ backend/
├─ docs/
├─ examples/
├─ scripts/
├─ .github/
├─ LICENSE
├─ README.md
├─ CONTRIBUTING.md
├─ CODE_OF_CONDUCT.md
└─ SECURITY.md
```

## Development Roadmap

### Milestone 1 - Monitoring MVP
- Authentication flow
- Dashboard
- Current stats
- Local history
- 24h charts
- CSV export

### Milestone 2 - Insights
- Tariff support
- Cost estimates
- Alerts
- Recommendations
- Historical comparisons

### Milestone 3 - Advanced Controls
- Battery reserve target
- Charge windows
- Inverter presets
- Confirmation flow
- Audit log

## Local-First Design

OpenSynk Desktop is designed to run entirely on the user's machine.

- Frontend runs locally
- Backend runs locally
- Tokens are stored locally
- No OpenSynk-hosted cloud service is required
- No user energy data is sent to third-party servers

## Development Setup

### Requirements
- Node.js 20+
- Python 3.12+
- Rust stable toolchain
- Tauri prerequisites

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
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Desktop
```bash
cd apps/desktop
npm install
npm run tauri dev
```

## Environment Variables

```env
SUNSYNK_API_BASE_URL=https://openapi.sunsynk.net
SUNSYNK_ACCESS_TOKEN=
DATABASE_URL=sqlite:///opensynk.db
POLL_INTERVAL_SECONDS=60
```

## Contributing

Contributions are welcome.

Please read:
- CONTRIBUTING.md
- CODE_OF_CONDUCT.md
- SECURITY.md

## License

MIT License
```

---

# Recommended License

Recommended license: MIT

Reason:
- Easy for community adoption
- Compatible with commercial and personal use
- Common choice for developer tools and integrations
- Already used by existing Sunsynk API-related projects

Suggested LICENSE header:

```text
MIT License

Copyright (c) 2026 OpenSynk Desktop Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

[standard MIT license text continues]
```

---

# First GitHub Issues

## Setup & Repo

1. Create initial monorepo structure
2. Add Tauri desktop shell
3. Add React + Vite frontend
4. Add FastAPI backend
5. Add SQLite database setup
6. Add ESLint, Prettier, Ruff, Black
7. Add GitHub Actions CI workflow
8. Add MIT license and community files

## Authentication

9. Create Sunsynk login/token configuration screen
10. Add encrypted local token storage
11. Add API client wrapper for Sunsynk endpoints
12. Add site and inverter selection flow
13. Add API retry and timeout handling

## Dashboard

14. Build dashboard summary cards
15. Add solar generation tile
16. Add battery SOC tile
17. Add grid import/export tile
18. Add today's totals tile
19. Add live power flow section
20. Add inverter status banner

## Charts & History

21. Store live samples in SQLite
22. Build 24-hour power chart
23. Build 7-day energy chart
24. Build 30-day cost chart
25. Add CSV export
26. Add historical comparison view

## Tariffs & Insights

27. Add tariff configuration screen
28. Add Octopus Agile support
29. Add Octopus Go support
30. Add overnight charge recommendation logic
31. Add estimated daily cost calculation
32. Add battery optimization suggestions

## Alerts

33. Add low battery alert rule
34. Add inverter offline alert rule
35. Add high grid import alert rule
36. Add solar underperformance alert rule
37. Add notification center UI

## Advanced Controls

38. Add write action confirmation modal
39. Add battery reserve control
40. Add charge window editor
41. Add inverter preset modes
42. Add control action audit log
43. Add safe rollback flow for failed write actions

## UI & UX

44. Add dark mode
45. Add responsive layout support
46. Add onboarding wizard
47. Add empty states and loading skeletons
48. Add settings page
49. Add multi-site support
50. Add desktop notifications

## Documentation

51. Add architecture.md
52. Add API notes documentation
53. Add safety documentation
54. Add contribution guide
55. Add screenshots and mock data
56. Add sample .env.example file
57. Add release checklist
58. Add installer documentation

---

# Suggested Labels

- bug
- enhancement
- documentation
- help wanted
- good first issue
- frontend
- backend
- api
- ui
- security
- controls
- monitoring
- charts
- alerts
- tariffs
- desktop
- research
- blocked
- needs discussion

