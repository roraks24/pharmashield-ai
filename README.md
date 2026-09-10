# AIVOA — AI-Powered Customer Complaint Management System

> An AI-powered pharmaceutical complaint intake and assessment system built with **React + Redux**, **Python + FastAPI**, **LangGraph**, and **Groq** (gemma2-9b-it).

---

## 📋 Product Overview

AIVOA automates the intake and initial assessment of customer complaints in pharmaceutical manufacturing. Instead of manually reading complaint emails/documents and filling forms, users can:

1. **Paste or upload** a complaint (email, PDF, or text)
2. **AI extracts** structured data (customer, product, batch, description, dates)
3. **Form auto-populates** with AI-suggested values (clearly marked)
4. **User reviews and edits** — human remains in control
5. **AI assesses risk** with rationale, root-cause hypotheses, and CAPA recommendations
6. **Save** the complaint record for future retrieval

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                  React + Redux                       │
│  (Vite, Tailwind CSS, Google Inter, lucide-react)   │
│  ┌─────────────┐  ┌──────────────────────────────┐  │
│  │ Complaint    │  │ AI Intake Assistant           │  │
│  │ Form (Left)  │  │ Upload/Paste → Progress →    │  │
│  │              │  │ Risk → Completeness → Chat   │  │
│  └─────────────┘  └──────────────────────────────┘  │
└───────────────────────┬─────────────────────────────┘
                        │ Axios / REST
                        ▼
┌─────────────────────────────────────────────────────┐
│              Python FastAPI Backend                  │
│  ┌─────────────┐  ┌──────────────────────────────┐  │
│  │ Routes      │  │ Services                      │  │
│  │ /copilot/*  │  │ ComplaintService (CRUD)       │  │
│  │ /complaints │  │ DocumentParser (PDF/TXT)      │  │
│  └──────┬──────┘  └──────────────────────────────┘  │
│         │                                            │
│  ┌──────▼──────────────────────────────────────────┐ │
│  │  LangGraph Workflow                              │ │
│  │  extract → validate → completeness → risk →      │ │
│  │  summarize                                       │ │
│  └──────┬──────────────────────────────────────────┘ │
│         │                                            │
│  ┌──────▼──────────────────────────────────────────┐ │
│  │  Groq (gemma2-9b-it)                             │ │
│  │  Structured extraction + Risk + Summary          │ │
│  └─────────────────────────────────────────────────┘ │
│                        ↓                             │
│  ┌─────────────────────────────────────────────────┐ │
│  │  PostgreSQL / In-Memory Storage                  │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### End-to-End Data Flow

```
User input → React → Redux thunk → POST /api/copilot/analyze
                                         ↓
                                    FastAPI validates request
                                         ↓
                                    LangGraph.invoke(state)
                                         ↓
                              ┌─── extract_complaint (Groq) ──┐
                              │    validate_fields             │
                              │    check_completeness          │
                              │    assess_risk (Groq)          │
                              │    summarize (Groq)            │
                              └────────────────────────────────┘
                                         ↓
                                    Pydantic validates output
                                         ↓
                                    AnalyzeResponse JSON
                                         ↓
                              Redux → form auto-populate + analysis UI
                                         ↓
                              User edits → POST /api/complaints → DB
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Redux Toolkit, Vite, Tailwind CSS |
| UI Font | Google Inter |
| Backend | Python 3.11+, FastAPI |
| AI Orchestration | LangGraph |
| LLM | Groq — `gemma2-9b-it` (configurable) |
| Validation | Pydantic v2 |
| Database | PostgreSQL 18 (via psycopg3 + SQLAlchemy 2.0 async) / SQLite fallback |
| Icons | Lucide React |

---

## 🚀 Local Setup

### Prerequisites

- **Python 3.11+**
- **Node.js 18+** with npm
- **Groq API key** — [Get one free at console.groq.com](https://console.groq.com/)

### 1. Clone & Environment

```bash
git clone <repo-url>
cd AIVOI
```

### 2. Backend Setup

```bash
cd backend

# Create .env from template
cp .env.example .env
# Edit .env and add your Groq API key:
# GROQ_API_KEY=gsk_your_key_here

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. Health check: `http://localhost:8000/health`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The UI will be available at `http://localhost:5173`

---

## 🔑 Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GROQ_API_KEY` | ✅ | — | Groq API key for LLM calls |
| `MODEL_NAME` | ❌ | `gemma2-9b-it` | LLM model identifier (configurable) |
| `DATABASE_URL` | ❌ | `sqlite:///./complaints.db` | Database connection string |

---

## 📡 API Overview

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/copilot/analyze` | Analyze complaint text/file → structured data + AI analysis |
| `POST` | `/api/copilot/message` | Conversational Copilot interaction |
| `POST` | `/api/complaints` | Save a reviewed complaint record |
| `GET` | `/api/complaints` | List all complaint records |
| `GET` | `/api/complaints/{id}` | Get complaint detail with AI analysis |
| `PATCH` | `/api/complaints/{id}/status` | Update complaint status |
| `GET` | `/health` | Health check |

### Example: Analyze Response

```json
{
  "complaint": {
    "customer_name": "ABC Pharma",
    "product_name": "Metformin Hydrochloride",
    "batch_number": "MH24032",
    "complaint_type": "Foreign Matter",
    "description": "Foreign particles observed in API material"
  },
  "analysis": {
    "completeness_score": 83,
    "risk_level": "HIGH",
    "risk_reason": "Potential product contamination affecting patient safety",
    "recommended_next_action": "QA review and investigation",
    "root_cause_hypotheses": ["Equipment malfunction", "Cross-contamination"],
    "capa_recommendations": ["Quarantine batch", "Equipment inspection"],
    "summary": "ABC Pharma reported metallic foreign particles in Metformin API batch MH24032..."
  }
}
```

---

## 🤖 LangGraph Workflow

The AI processing pipeline uses **LangGraph** with a sequential graph of five nodes:

| # | Node | Responsibility | LLM? |
|---|---|---|---|
| 1 | `extract_complaint` | Parse unstructured text → structured JSON | ✅ Groq |
| 2 | `validate_fields` | Normalize enums, dates, strip nulls | ❌ |
| 3 | `check_completeness` | Score field completeness (0–100) | ❌ |
| 4 | `assess_risk` | Risk level + rationale + root cause + CAPA | ✅ Groq |
| 5 | `summarize` | 2-3 sentence reviewer summary | ✅ Groq |

Each node is a pure function receiving shared `ComplaintGraphState` and returning partial updates.

---

## 🧪 Demo Data

Five synthetic pharmaceutical complaint samples are included in `backend/sample_data/`:

| File | Scenario | Expected Risk |
|---|---|---|
| `complaint_a.txt` | Foreign particles in Metformin API batch | HIGH |
| `complaint_b.txt` | Packaging/label error on Amoxicillin | MEDIUM |
| `complaint_c.txt` | Incomplete email, missing key fields | — (tests completeness) |
| `complaint_d.txt` | Near-duplicate of Complaint A | — (tests similarity) |
| `complaint_e.txt` | Vague/ambiguous quality complaint | — (tests uncertainty) |

---

## 📁 Project Structure

```
AIVOI/
├── backend/
│   ├── main.py                  # FastAPI app entry + DB lifecycle
│   ├── config.py                # Settings (pydantic-settings)
│   ├── database.py              # SQLAlchemy async engine + session
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example             # Environment template
│   ├── models/
│   │   ├── complaint.py         # Complaint Pydantic schemas
│   │   ├── analysis.py          # AI Analysis schemas
│   │   └── db_models.py         # SQLAlchemy ORM models (complaints + analyses)
│   ├── routes/
│   │   ├── copilot.py           # /api/copilot/* endpoints
│   │   └── complaints.py        # /api/complaints/* endpoints
│   ├── services/
│   │   ├── complaint_service.py # CRUD + analysis persistence
│   │   └── document_parser.py   # PDF/TXT text extraction
│   ├── graph/
│   │   ├── state.py             # LangGraph shared state
│   │   ├── nodes.py             # Processing nodes (extract, validate, etc.)
│   │   └── workflow.py          # Graph construction & compilation
│   ├── sample_data/             # 5 synthetic complaint files
│   └── utils/
│       └── helpers.py           # JSON parsing helpers
├── frontend/
│   ├── src/
│   │   ├── main.jsx             # React entry (Provider + Router)
│   │   ├── App.jsx              # Route definitions
│   │   ├── index.css            # Tailwind + Inter font
│   │   ├── store/               # Redux Toolkit slices
│   │   │   ├── complaintSlice   # Form state + dirty tracking
│   │   │   ├── analysisSlice    # AI extraction/analysis state
│   │   │   ├── copilotSlice     # Chat state
│   │   │   └── complaintsSlice  # List/detail state
│   │   ├── services/api.js      # Axios HTTP client
│   │   ├── components/
│   │   │   ├── complaint/       # Form sections
│   │   │   ├── assistant/       # AI Assistant panel
│   │   │   ├── complaints/      # List + Detail views
│   │   │   └── common/          # Badges, Spinner
│   │   └── pages/               # IntakePage, ComplaintsPage
│   └── vite.config.js
└── README.md
```

---

## 🎯 Key Design Decisions

1. **Human-in-the-loop**: AI suggests, user confirms. AI-populated fields are visually distinguished and user edits are protected from AI overwrite.

2. **Multi-step LangGraph**: Instead of one opaque LLM call, the pipeline is decomposed into testable, explainable nodes — important for interview walkthrough.

3. **Cautious AI language**: Risk assessments use "suggested", "potential", "consider" — never final regulatory decisions.

4. **Schema validation**: Pydantic validates both API requests and LLM outputs before they reach the UI or database.

5. **Separation of concerns**: React components render, Redux owns state, API service handles HTTP, FastAPI routes orchestrate, LangGraph processes, Groq generates.

---

## ⚠️ Limitations & Future Work

- **SQLite by default**: Uses SQLite for zero-config local dev. Switch `DATABASE_URL` in `.env` to PostgreSQL for production (async driver: `asyncpg`).
- **Document parsing**: Basic PDF text extraction (PyPDF2). Production would need OCR for scanned documents.
- **No authentication**: No user login or RBAC — out of scope for demo.
- **Single-threaded AI**: LangGraph runs synchronously. Production would use async workers.
- **Duplicate detection**: Not yet implemented (P1 backlog).

---

## 📜 License

This project was built as a technical assessment submission.
