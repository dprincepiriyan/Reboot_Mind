# MAD — Anonymous Addiction Support App

MAD is a Progressive Web App (PWA) that connects people struggling with the same addiction into small, fully anonymous support chatrooms. It includes onboarding questionnaires, algorithmic matching, real-time group chat, a sobriety tracker, daily support tasks, and an SOS/crisis alert system.

## Features
- **Total Anonymity**: Real identities are kept completely separate from chat/matching. Display names (e.g. "Fox_482") and procedural avatars are used.
- **Algorithmic Grouping**: Scikit-Learn based K-Means / Cosine Similarity clustering pairs users with similar addiction severity into small support circles.
- **Real-Time Chat**: WebSockets via Socket.IO with instant message delivery and persistent chat history.
- **SOS Crisis Alert**: Dual-level emergency alert system ("I'm struggling" & "I need help now" with direct crisis resources).
- **Sobriety Tracker**: Streak tracker, daily check-ins, and milestone badges.
- **Daily Support Tasks**: Daily recovery tasks with visual progress tracking.
- **PWA Ready**: Works offline for cached views and installable on mobile/desktop.
- **100% Free & Open Source**: Self-contained with Docker Compose. No paid APIs required.

## Quickstart

Run the full application stack locally with Docker Compose:

```bash
docker compose up --build
```

Access the application:
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

### Demo Seed Data
To populate the app with 8 dummy users across 3 addiction types (Alcohol, Smoking, Gaming) and test the matching & chat features live:

```bash
docker compose exec backend python seed.py
```
*(All seed users use password `demo123`)*

## Tech Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Socket.IO Client, Lucide Icons, Framer Motion
- **Backend**: Python 3.11, FastAPI, python-socketio, SQLAlchemy (Async), Alembic, APScheduler, scikit-learn, Passlib (bcrypt), PyJWT
- **Data Layer**: PostgreSQL 16, Redis 7
- **Infra**: Docker & Docker Compose
