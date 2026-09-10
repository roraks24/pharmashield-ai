# AIVOA — Demo Video & Interview Walkthrough Guide

This guide gives you an exact, step-by-step walkthrough script for recording your **5–10 minute demo video** and preparing for technical interview questions.

---

## 🎬 Video Recording Structure (5–10 Minutes)

The assignment requests two core areas:
1. **Working Demonstration** of all implemented AI tools & frontend features (~3–4 mins)
2. **Code & Architecture Walkthrough** showing the complete end-to-end data flow (~3–4 mins)

---

### Part 1: Working Live Demonstration (3–4 mins)

> **Important Rule from Recruiters:**
> *"Important note: you must not fill the left form manually. Instead, use the AI assistant on the right to fill and update the left form."*

#### Step 1: Start Both Servers
- Terminal 1 (Backend): `cd backend && python main.py` (Runs on port 8000 with PostgreSQL)
- Terminal 2 (Frontend): `cd frontend && npm run dev` (Runs on `http://localhost:5173`)
- Open browser at `http://localhost:5173`.

#### Step 2: Show the Initial UI
- Point out the two-column layout:
  - **Left Panel**: **Log Customer Complaint** (API & FDF Quality Assurance Module)
    - "Pending Triage" badge in top-right.
    - All fields display `"Awaiting AI extraction..."`.
  - **Right Panel**: **AI Complaint Intake Assistant (BETA)**
    - Drag & drop document zone + "Paste Complaint Text / Email" button.
    - AI Copilot Assistant chat at the bottom with quick demo prompt chips.

---

### Mandatory AI Tool Demonstrations

#### 🌟 Tool 1: Log Complaint Tool (Chat Prompt)
1. In the AI Assistant chat, enter the recruiter's exact prompt (or click the quick chip):
   > *"Apollo Pharmacy reported discolored capsules in Amoxicillin capsules 500 mg."*
2. Press **Send**.
3. **Point out the result**:
   - The AI Assistant responds confirming the complaint has been logged.
   - The **Left Form** immediately populates:
     - **Customer Name**: *Apollo Pharmacy*
     - **Product Name**: *Amoxicillin capsules*
     - **Product Strength**: *500 mg*
     - **Complaint Description**: *Apollo Pharmacy reported discolored capsules in Amoxicillin capsules 500 mg.*
     - AI sparkle icons (`✦`) appear on populated fields.
   - The **Right Panel** automatically generates:
     - **Risk Assessment**: Medium risk with technical rationale.
     - **Completeness Checker**: Highlights missing fields (batch number, quantity, expiry date).

---

#### 🌟 Tool 2: Edit Complaint Tool (Natural Language Update in Chat)
1. In the chat, type the recruiter's exact edit prompt:
   > *"Sorry, the batch number is BMX24602 and the affected quantity is 48 capsules."*
2. Press **Send**.
3. **Point out the result**:
   - The AI Assistant confirms: *"I have updated the complaint record with batch number BMX24602 and an affected quantity of 48 capsules."*
   - On the **Left Form**:
     - **Batch / Lot Number** updates to: `BMX24602`
     - **Quantity Affected** updates to: `48 capsules`
   - **Critical Point to Highlight**: All other previously extracted fields (*Apollo Pharmacy*, *Amoxicillin capsules*, *500 mg*, *Description*) and the **Risk Assessment** are **100% strictly preserved**!
   - Completeness score dynamically increases as missing fields are resolved!

---

#### 🌟 Tool 3: Document Extraction Tool (File Upload / Paste) + Follow-up Chat Edit
1. Click **Reset Form** (or refresh page) to show a clean intake.
2. In the upload card:
   - Drag & drop `AIVOA_test_customer_complaint.pdf` (or click "Paste Complaint Text / Email" and paste `backend/sample_data/complaint_a.txt`).
3. Click **"Analyze with AI"**:
   - Progress bar animates to 100%.
   - Left form is automatically populated with all fields from the document.
   - Risk Assessment, Completeness score, and Summary are generated.
4. Now immediately demonstrate **Tool 2 on the uploaded document**:
   - In chat, type:
     > *"Sorry, the batch number is CHG260712A and affected quantity is 50 kg 2 HDPE drums."*
   - Watch the AI update the batch number and quantity while preserving all other PDF extracted details!

---

#### Step 5: Save & Duplicate Detection
1. Click **"Save Complaint"** at bottom left. The complaint is persisted directly to **PostgreSQL**.
2. To demonstrate **Duplicate Detection**:
   - Paste `backend/sample_data/complaint_d.txt` (a second complaint for the same batch).
   - The system displays the **"Potential Duplicate Detected"** alert card with similarity match!
3. Navigate to **"Complaints"** in the top navigation to show the persistent records in PostgreSQL.

---

### Part 2: Code & Architecture Walkthrough (3–4 mins)

> **🎯 The 2-Minute Quick Explanation (Read this in your video):**
>
> *"Our architecture follows a clean, decoupled 5-tier design:*
> 1. * **Frontend UI (`frontend/src/components/`)**: Built in React with Tailwind CSS and Google Inter typography. We created a reusable `FormField` component that binds directly to our Redux store. It automatically handles input changes and displays AI sparkle indicators (`✦`) whenever data is populated by AI and untouched by the user.
> 2. * **State Management (`frontend/src/store/`)**: Using Redux Toolkit across 4 dedicated slices: `complaintSlice` for form fields and dirty-tracking, `analysisSlice` for AI risk assessment and completeness scores, `copilotSlice` for chat interactions and action dispatching, and `complaintsSlice` for history.
> 3. * **API Gateway (`backend/routes/`)**: FastAPI endpoints with Pydantic validation. The `/api/copilot/message` endpoint acts as an Agentic Intent Router that classifies whether the user is logging a new complaint (Tool 1), editing specific fields in natural language (Tool 2), or asking QA questions.
> 4. * **AI Agentic Workflow (`backend/graph/`)**: Orchestrated using **LangGraph** across 5 sequential nodes: entity extraction, deterministic validation, completeness scoring, risk assessment with CAPA hypotheses, and executive summary generation using Groq.
> 5. * **Database Layer (`backend/database.py` & `models/`)**: Persistent storage in local **PostgreSQL 18** using async SQLAlchemy ORM and Psycopg 3 with 1-to-1 relational cascade between `complaints` and `analyses`.*"

---

#### Detailed Code Walkthrough

#### 1. Frontend: Redux State & Form Handling
- `frontend/src/store/analysisSlice.js`:
  - `analyzeComplaint` async thunk dispatches `multipart/form-data` to `/api/copilot/analyze`.
  - Stores `extractedData`, `risk`, `completeness`, `summary`, and `duplicate` detection results.
- `frontend/src/store/complaintSlice.js`:
  - Tracks `formData` and `dirtyFields`.
  - When AI analysis returns, `updateMultipleFields` updates untouched fields without overwriting user manual edits.

#### 2. API Layer: FastAPI Router
- `backend/routes/copilot.py`:
  - Receives either text or uploaded document (parsed via `document_parser.py`).
  - Calls `graph.invoke({"raw_text": raw_text})`.
  - Performs duplicate detection query via `ComplaintService.find_potential_duplicates(db, ...)`.
  - Validates and returns strict `AnalyzeResponse` Pydantic model.

#### 3. AI Pipeline: LangGraph Workflow
- `backend/graph/workflow.py` & `nodes.py`:
  - Explain why LangGraph was chosen over a single prompt:
    > *"Instead of asking the LLM to do everything in one opaque prompt, we decomposed the workflow into 5 modular, testable nodes:"*
    1. `extract_complaint`: Extracts structured entity JSON using Groq (`gemma2-9b-it`).
    2. `validate_fields`: Deterministic normalization (casing, date formatting, enum validation).
    3. `check_completeness`: Deterministic scoring (0–100%) against critical and important GMP complaint fields.
    4. `assess_risk`: Generates risk tier, factual justification, root-cause hypotheses, and CAPA recommendations.
    5. `summarize`: Generates a concise reviewer summary.

#### 4. Database Layer: SQLAlchemy ORM
- `backend/database.py` & `models/db_models.py`:
  - Async SQLAlchemy engine (`create_async_engine`).
  - Relational schema: `ComplaintDB` (1-to-1) `AnalysisDB` with cascade delete.
  - Zero-config SQLite for local dev, switchable to PostgreSQL via `DATABASE_URL` for production.

---

## 🏆 Bonus Features Implemented Summary

You can proudly highlight that **all 6 bonus features** mentioned in the assignment are fully implemented:

| Feature | Where It Is Implemented |
|---|---|
| **Complaint Completeness Checker** | Node 3 (`check_completeness`) + `CompletenessCheck.jsx` UI |
| **Root Cause Recommendation** | Node 4 (`assess_risk`) + `ComplaintDetail.jsx` UI |
| **Duplicate Complaint Detection** | `find_potential_duplicates` in `complaint_service.py` + `DuplicateAlertCard` |
| **CAPA Recommendation** | Node 4 (`assess_risk`) + `ComplaintDetail.jsx` UI |
| **Complaint Summary** | Node 5 (`summarize`) + `SummaryCard` UI |
| **AI Risk Classification** | Node 4 (`assess_risk`) + `RiskBadge.jsx` UI |

---

## 💡 Top Interview Questions & Strong Answers

### Q1: *"Why did you use LangGraph instead of a single LLM prompt?"*
**Answer:**
> "In pharmaceutical QA, auditability and determinism are paramount. A single LLM prompt trying to extract data, validate, compute risk, check completeness, and summarize often suffers from hallucination and prompt drift.
> With LangGraph:
> - Each node has a single responsibility.
> - Validation and completeness scoring are **deterministic** Python rules, not LLM guesses.
> - Individual nodes can be unit tested, monitored, or swapped with different models without breaking the entire pipeline."

### Q2: *"How do you prevent the AI from overwriting human input?"*
**Answer:**
> "We implement dirty field tracking in Redux (`complaintSlice.js`). When a user edits an input, that field is marked 'dirty'. When AI extraction completes, the auto-population action checks the dirty map and only overwrites untouched fields, preserving human authority."

### Q3: *"How does Duplicate Complaint Detection work?"*
**Answer:**
> "The backend checks the database for two signals:
> 1. Exact batch number matching on active complaints (the strongest defect correlation in pharma).
> 2. Keyword overlap in complaint descriptions for the same product name.
> When a match is found, an alert card renders in the intake workspace with match confidence and reference complaint ID, alerting the QA officer before duplicate CAPA investigations are launched."
