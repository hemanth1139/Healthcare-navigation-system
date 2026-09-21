# 🏥 AI-Based Healthcare Navigation & Patient Assistance System

An integrated, evidence-grounded AI platform designed to guide patients through conversational symptom assessment, clinical urgency evaluation, specialist and hospital discovery, and government healthcare scheme eligibility determination.

---

## 🌟 Overview

Navigating healthcare systems can be complex, especially in underserved or rural communities. Patients often struggle to evaluate symptom urgency, find the right medical specialist, locate nearby facilities, or determine eligibility for government schemes like **AB-PMJAY**.

This system unifies patient navigation into a single, seamless platform:
1. **Conversational Intake:** Collects complete symptom history through intelligent multi-turn dialogue powered by **Gemini 2.5 Flash**.
2. **Clinical Severity & Disease Engine:** Uses a transparent, rule-based clinical engine covering **12 major disease categories** and red-flag urgency criteria (Emergency, Urgent, Non-Urgent, Routine).
3. **Specialist & Hospital Routing:** Maps symptom clusters to appropriate medical specialties and finds nearby hospitals via **Google Maps API**.
4. **Scheme Eligibility RAG:** Evaluates eligibility for government schemes using a Retrieval-Augmented Generation (RAG) framework with criterion-level evidence verification.

---

## 🚀 Key Highlights & Optimization

- **⚡ Ultra-Lightweight Footprint:** Optimized to run comfortably on low-RAM environments (**~200MB RAM** total backend memory).
- **🚫 Zero Heavy Dependencies:** Removed heavy ML frameworks (PyTorch, XGBoost, Sentence-Transformers, ChromaDB SDK) in favor of pure-Python rule engines and Google API embeddings.
- **📦 Containerless Ready:** Deploys directly on free-tier platforms (Railway, Hugging Face Spaces, Render, Vercel) without needing complex Docker setups.
- **🔒 Privacy-Conscious:** Fast inline regex scrubbing for PII protection.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework:** Next.js 14 (App Router, TypeScript)
- **Styling:** Tailwind CSS & Lucide Icons
- **Deployment:** Vercel

### **Backend**
- **Framework:** FastAPI (Python 3.10+)
- **Database:** PostgreSQL with SQLAlchemy (Async ORM) & Alembic
- **AI & RAG Engine:** LangChain + **Gemini 2.5 Flash** API
- **Embeddings:** Google Gemini API (`text-embedding-004`)
- **Vector Store:** Pure-Python Lightweight JSON Vector Store
- **Clinical Engine:** Rule-based Disease & Severity Predictor
- **Location Services:** Google Maps Places & Geocoding API

---

## 📁 Repository Structure

```
Healthcare-navigation-system/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # REST endpoints (auth, patients, predictions, RAG, etc.)
│   │   ├── core/            # Core configuration & JWT auth
│   │   ├── ml/              # Pure-Python rule-based clinical predictor engine
│   │   ├── models/          # SQLAlchemy database models
│   │   ├── rag/             # VectorStore, embeddings & RAG pipeline
│   │   ├── schemas/         # Pydantic models & DTOs
│   │   └── services/        # Business logic & domain services
│   ├── requirements.txt     # Clean, lightweight backend dependencies
│   └── main.py              # FastAPI app initialization
├── frontend/
│   ├── app/                 # Next.js 14 App Router pages & layouts
│   ├── components/          # Reusable UI components & cards
│   ├── lib/                 # API client & utility functions
│   └── types/               # TypeScript interfaces
├── Project_phase_1.md       # Detailed system design & specification document
├── literature survey.md     # Academic research & literature survey
└── README.md                # Project README
```

---

## ⚙️ Local Development Setup

### 1. Prerequisites
- **Node.js:** v18+ 
- **Python:** v3.10+
- **PostgreSQL:** Local database or cloud instance (e.g. Supabase, Neon)
- **API Keys:** Google Gemini API key and Google Maps API key

---

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env   # Fill in your DATABASE_URL, GEMINI_API_KEY, JWT_SECRET, etc.

# Run database migrations
alembic upgrade head

# Start backend server
uvicorn app.main:app --reload --port 8000
```

The backend API will be available at `http://localhost:8000` (API Docs: `http://localhost:8000/docs`).

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
# NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here

# Run development server
npm run dev
```

The frontend app will be available at `http://localhost:3000`.

---

## 🌐 Deployment Options

- **Frontend:** Deploy seamlessly on **Vercel** with zero configuration.
- **Backend:** Can be deployed on **Railway.app**, **Hugging Face Spaces**, or **Render Starter**.
- **Database:** Free hosted PostgreSQL instance on **Supabase** or **Neon**.

---

## 📄 License & Documentation

For detailed architecture diagrams, database schemas, and research background, refer to:
- [Project Phase 1 Specification](Project_phase_1.md)
- [Literature Survey](literature%20survey.md)
