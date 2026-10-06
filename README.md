# 🏥 Healthcare Navigation System

A full-stack AI-powered healthcare navigation platform that helps citizens discover government health schemes, find nearby hospitals, check symptom-based triage, manage medical records, and predict specialist recommendations — all through a single unified interface.

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Environment Setup](#-environment-setup)
- [Running the Backend](#-running-the-backend)
- [Running the Frontend](#-running-the-frontend)
- [API Reference](#-api-reference)
- [Database](#-database)

---

## 🔍 Project Overview

The Healthcare Navigation System is designed to bridge the gap between citizens and India's public healthcare infrastructure. It uses Google Gemini LLMs and a RAG (Retrieval-Augmented Generation) pipeline to provide accurate, document-grounded answers about government health schemes (PM-JAY, Ayushman Vay Vandana, Tamil Nadu state schemes, etc.).

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| Next.js | 14.2.35 | React framework (App Router) |
| TypeScript | ^5 | Type safety |
| Tailwind CSS | ^4.3 | Styling |
| Leaflet | ^1.9.4 | Interactive hospital maps |
| Recharts | ^3.10 | Health analytics charts |
| React Hook Form + Zod | latest | Form validation |
| Axios | ^1.19 | HTTP client |
| Lucide React | ^1.28 | Icons |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| FastAPI | ^0.111 | REST API framework |
| Python | 3.11+ | Runtime |
| SQLAlchemy (async) | ^2.0 | ORM |
| SQLite / PostgreSQL | — | Database |
| Alembic | ^1.13 | Database migrations |
| LangChain + LangGraph | ^0.2 | LLM orchestration & agents |
| Google Gemini | — | LLM provider |
| OpenStreetMap / Leaflet | — | Hospital geolocation & map (Free, no API key needed) |
| Local Storage / Cloudinary | ^1.39 | File uploads (Local fallback built-in, Cloudinary optional) |
| aiosmtplib | ^3.0 | Email notifications |

---

## 📁 Project Structure

```
Healthcare-navigation-system/
├── frontend/                  # Next.js 14 app (App Router)
│   ├── app/
│   │   ├── (auth)/            # Login, Register, Forgot Password pages
│   │   └── (dashboard)/       # Main app pages
│   │       ├── dashboard/     # Health overview & analytics
│   │       ├── schemes/       # Government scheme discovery & AI eligibility
│   │       ├── hospitals/     # Nearby hospital finder with map
│   │       ├── predictions/   # Specialist prediction history
│   │       ├── history/       # Triage & prediction history
│   │       ├── profile/       # Patient profile & medical records
│   │       ├── chat/          # AI symptom triage chat
│   │       └── settings/      # App preferences
│   ├── components/            # Reusable UI components
│   ├── context/               # React context providers (Auth, Language)
│   ├── lib/                   # API clients and utilities
│   └── types/                 # TypeScript type definitions
│
└── backend/                   # FastAPI application
    ├── app/
    │   ├── api/v1/            # REST API route handlers
    │   ├── agents/            # LangGraph AI agents
    │   ├── rag/               # RAG pipeline & vector store
    │   ├── models/            # SQLAlchemy ORM models
    │   ├── schemas/           # Pydantic request/response schemas
    │   ├── services/          # Business logic layer
    │   ├── ml/                # ML prediction utilities
    │   ├── fhir/              # FHIR medical record integration
    │   └── core/              # Database engine & base config
    ├── alembic/               # Database migration scripts
    ├── requirements.txt       # Python dependencies
    └── healthcare_schemes.json # Seed data for government schemes
```

---

## ✨ Features

- **🤖 AI Scheme Eligibility Assistant** — Ask natural language questions about PM-JAY, Ayushman Vay Vandana, and other schemes. Powered by Gemini + a RAG vector store of official government PDFs.
- **🏥 Hospital Finder** — Find nearby hospitals with distance calculation, interactive Leaflet map, and Google Maps directions.
- **💬 Symptom Triage Chat** — Conversational AI triage with emergency escalation detection.
- **📊 Health Analytics Dashboard** — Visual overview of predictions, scheme matches, and health tips.
- **👤 Patient Profile** — Manage demographics, allergies, conditions, medications, and medical records (with local storage or Cloudinary).
- **🔐 Auth System** — JWT-based auth with refresh tokens, email verification, Google OAuth, and password reset.
- **🌐 Multilingual Support** — English and Tamil (தமிழ்) UI.
- **📋 Prediction History** — View past specialist recommendation predictions with triage context.

---

## ✅ Prerequisites

Make sure you have the following installed:

- **Node.js** >= 18.x and **npm** >= 9.x
- **Python** >= 3.11
- **pip** and **venv**
- A **Google Gemini API key** (free at https://aistudio.google.com)

> [!NOTE]
> **No Google Maps API or Cloudinary account is required:**
> - **Maps**: The application uses **OpenStreetMap & Leaflet**, which are completely free and require no API key.
> - **Document Uploads**: The application includes a **built-in local file storage fallback** (`backend/uploads/`). You only need Cloudinary if you specifically choose to host files in the cloud.

---

## 🔧 Environment Setup

### Backend `.env`

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and fill in your keys:

```env
# ─── Required ──────────────────────────────────────────
SECRET_KEY=your-super-secret-256-bit-key      # generate: openssl rand -hex 32
GOOGLE_API_KEY=your-gemini-api-key

# Database (SQLite by default — zero extra setup needed)
DATABASE_URL=sqlite+aiosqlite:///./healthcare_db.db

# ─── Optional (Leave blank or omit to use defaults) ────
# Not needed: hospital maps use free OpenStreetMap automatically
GOOGLE_MAPS_API_KEY=

# Not needed: uploads automatically fall back to local disk storage
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Optional: only if you want email verification/notifications
SMTP_USER=
SMTP_PASSWORD=
```

### Frontend `.env.local`

> **What is `.env.local`?**  
> `.env.local` is a standard Next.js configuration file for your local environment variables. Next.js automatically loads it during development (`npm run dev`) and prioritizes it. It is also listed in `.gitignore` by default so your machine-specific settings and private keys are never committed to GitHub.

```bash
cd frontend
cp .env.example .env.local
```

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_USE_MOCK_API=false
```

---

## 🐍 Running the Backend

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run database migrations
alembic upgrade head

# 5. Initialize database with seed data
python scripts/seed_schemes.py
python scripts/seed_chennai_hospitals.py
python scripts/seed_demo_user.py

# 6. Start the development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at:
- **API Base:** `http://localhost:8000/api/v1`
- **Interactive Docs (Swagger):** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

> **Note:** After running migrations, you must run the seed scripts to initialize the database with government schemes, hospitals, and a demo user account.

---

## ⚛️ Running the Frontend

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The frontend will be available at **`http://localhost:3000`**.

### Other Frontend Commands

```bash
# Build for production
npm run build

# Start production server (after build)
npm start

# Run ESLint
npm run lint
```

---

## 📡 API Reference

All endpoints are prefixed with `/api/v1`.

| Module | Endpoints | Description |
|---|---|---|
| **Auth** | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` | JWT authentication |
| **Profile** | `GET/PUT /profile`, `/profile/allergies`, `/profile/conditions`, `/profile/medications` | Patient profile management |
| **Schemes** | `GET /schemes`, `GET /schemes/{id}`, `POST /schemes/query`, `POST /schemes/query/continue` | Government scheme listing & RAG eligibility |
| **Hospitals** | `GET /hospitals/nearby` | Hospital finder with geolocation |
| **Predictions** | `GET /predictions`, `GET /predictions/{id}`, `POST /predictions` | Specialist recommendations |
| **History** | `GET /history`, `GET /history/{id}` | Triage & prediction history |
| **Conversations** | `GET /conversations`, `POST /conversations`, `POST /conversations/{id}/messages` | AI chat sessions |
| **Documents** | `POST /documents/upload`, `GET /documents` | Medical record uploads |
| **Dashboard** | `GET /dashboard/summary` | Health analytics overview |
| **Settings** | `GET/PUT /settings` | User preferences |

---

## 🗄️ Database

The project uses **SQLite** by default (zero configuration), stored at `backend/healthcare_db.db`.

To switch to **PostgreSQL** for production, update `DATABASE_URL` in your `.env`:

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/healthcare_db
```

Then run migrations:

```bash
alembic upgrade head
```

To create a new migration after model changes:

```bash
alembic revision --autogenerate -m "describe your change"
alembic upgrade head
```

---

## 👤 Demo Account

On first backend startup, a demo account is automatically created:

| Field | Value |
|---|---|
| Email | `demo@healthcare.com` |
| Password | `Demo@1234` |

---

*Built with Next.js 14, FastAPI, and Google Gemini.*
