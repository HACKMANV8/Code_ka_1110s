# Drishti

AI-assisted exam creation, proctoring, and review platform that blends a modern Next.js experience with real-time monitoring, on-device ML, and retrieval-augmented feedback for students and administrators.

## Highlights
- Secure exam lifecycle built on Supabase authentication, row-level security, and SQL migrations.
- Real-time proctoring with live WebRTC streams, automated snapshots, and continuous focus scoring.
- Camera-manipulation desktop detector to flag virtual cameras and enforce single-camera usage.
- Python services for vision-based cheating detection (YOLO + MediaPipe) and Azure-backed RAG exam reviews.
- Rich admin dashboards for exam creation, leaderboard analytics, and transcripted student reviews.

## System Overview
Drishti is a polyglot workspace made up of coordinated services:

- **Next.js 14 front end (`app/`)** – core UI for students and admins, Supabase auth integration, exam orchestration, and API routes.
- **Supabase backend (`supabase/`)** – SQL migrations, row-level security policies, and helper scripts for provisioning roles and exam data.
- **Focus monitoring service (`model_prediction/`)** – FastAPI app that analyzes webcam frames and streams focus telemetry back to the browser.
- **RAG review service (`rag_system/`)** – FastAPI + LangChain pipeline that turns uploaded exam material into contextual AI feedback.
- **Detector desktop app (`detector/`)** – Electron utility that exposes a local REST API and defends against virtual camera software.

These services communicate over HTTP and Supabase Realtime channels. The Next.js app proxies requests to the ML layer, persists telemetry in Supabase, and pulls AI explanations from the RAG service after exams conclude.

## Repository Layout
| Path | Purpose |
| --- | --- |
| `app/` | Next.js App Router pages, API routes (`app/api/**`), auth flows, exam UIs, and styling (`globals.css`). |
| `components/` | Shared UI building blocks, including admin live viewers and student review cards. |
| `lib/` | Supabase client helpers (`client.ts`, `server.ts`, `middleware.ts`) and shared type definitions. |
| `middleware.ts` | Next.js middleware that keeps Supabase sessions in sync. |
| `detector/` | Electron + Express application for detecting suspicious video pipelines and blocking flagged hosts. |
| `model_prediction/` | FastAPI focus-monitoring server with OpenCV, MediaPipe, and YOLO-based device detection. |
| `rag_system/` | Retrieval-Augmented Generation backend, FAISS vector store, and upload/processing utilities. |
| `supabase/` | SQL migrations, seed scripts, and helper queries for the managed Postgres instance. |
| `public/` | Static assets exposed via Next.js. |

## Prerequisites
- Node.js 18.18+ and npm 9+ (Next.js 14 requirement).
- Python 3.10+ with virtual environment tooling (`venv` or `conda`) for the FastAPI services.
- Supabase project (cloud or local via `supabase start`) with access to the SQL editor/CLI.
- Azure OpenAI resource (chat + embeddings) for the RAG system, or equivalent Azure-compatible deployments.
- Optional: Administrator/root privileges when running the detector app to allow hosts-file edits.

## Environment Variables

### Next.js (`.env.local` in repo root)
```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase anon key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Focus monitoring
ML_SERVER_URL=http://127.0.0.1:8080
NEXT_PUBLIC_ML_SERVER_URL=http://127.0.0.1:8080

# Virtual camera detector
NEXT_PUBLIC_DETECTOR_URL=http://127.0.0.1:4000/scan

# RAG service
RAG_API_URL=http://localhost:8002
```

> The `NEXT_PUBLIC_*` keys are exposed to the browser. Keep service-role keys out of the client bundle.

### RAG system (`rag_system/.env`)
```
# Chat completions
AZURE_OPENAI_CHAT_API_KEY=...
AZURE_OPENAI_CHAT_ENDPOINT=https://<resource>.openai.azure.com/
AZURE_OPENAI_CHAT_API_VERSION=2024-02-15-preview
AZURE_OPENAI_CHAT_DEPLOYMENT=<chat deployment name>

# Embeddings
AZURE_OPENAI_EMBEDDING_API_KEY=...
AZURE_OPENAI_EMBEDDING_ENDPOINT=https://<resource>.openai.azure.com/
AZURE_OPENAI_EMBEDDING_API_VERSION=2023-05-15
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=<embedding deployment name>

# Optional fallbacks (single-endpoint setups)
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_VERSION=
```

### Detector overrides (`detector/.env` – optional)
```
PORT=4000
SCAN_CACHE_MS=5000
```

## Setup & Local Development

### 1. Provision Supabase
1. Create or link a Supabase project.
2. Run the SQL files under `supabase/migrations/` using the Supabase SQL editor or CLI (`supabase migration up` for linked projects).
3. Seed helper data as needed:
   - `supabase/create_admin_user.sql` – promote a specific user after signup.
   - `supabase/complete_exam_setup.sql` & `supabase/fix_student_answers_schema.sql` – sync schema fixes referenced in `FIXES_APPLIED.md`.
4. Configure the Auth redirect URLs (`http://localhost:3000`) and copy the project URL + anon key into `.env.local`.

### 2. Run the Next.js app
```bash
npm install
npm run dev
```

- Linting: `npm run lint`
- Builds: `npm run build && npm run start`
- The dev server runs on `http://localhost:3000`.

### 3. Start the focus monitoring API (`model_prediction/`)
```bash
cd model_prediction
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn api:app --host 127.0.0.1 --port 8080 --reload
```

- Requires access to a webcam.
- Endpoints exposed:
  - `POST /analyze-frame` – single-frame analysis used by `/api/ml-proxy`.
  - `GET /webcam/stream` – MJPEG stream with overlays.
  - `WEBSOCKET /analyze` – live stream scoring.
- The bundled `yolov8n.pt` weights power phone detection; keep the file in place or adjust paths in `FocusMonitor`.

### 4. Start the RAG review API (`rag_system/`)
```bash
cd rag_system
python3 -m venv venv
source venv/bin/activate        # Windows: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```

- Upload exam material via `POST /upload`.
- Query for explanations with `POST /query` and whole-exam reviews via `POST /review`.
- Health check available at `GET /health`.
- See `rag_system/SETUP.md` and `rag_system/QUICKSTART.md` for detailed Azure setup guidance.

### 5. Launch the detector desktop app (`detector/`)
```bash
cd detector
npm install
npm start
```

- Requires elevated permissions to edit the hosts file and block listed domains (e.g., Reddit).
- REST endpoints exposed on `http://localhost:4000`:
  - `GET /health`
  - `GET /scan`
  - `GET /scan/refresh`
- Use `npm run api` for a headless API-only process if the Electron shell is not required.

## Exam Workflow at a Glance
- **Create exams** – Admins craft exams with question banks via the Next.js admin panel (`/admin`), backed by `exams` and `exam_questions` tables.
- **Student session** – Students join exams (`/exam/[id]`), spawning records in `exam_sessions` and streaming focus data to Supabase (`cheat_scores`).
- **Live monitoring** – Admins subscribe to Supabase Realtime channels for WebRTC offers, watch live student feeds, and inspect snapshots flagged by the ML service.
- **Submission & scoring** – Exams are evaluated server-side (`app/api/exam/submit`) with answer normalization fixes captured in `FIXES_APPLIED.md`.
- **AI review** – After completion, students request explanations; the Next.js API aggregates Supabase data and calls the RAG service (`/api/exam/ai-review` → `RAG_API_URL/review`).

## Useful Commands
- `npm run lint` – ESLint via `next lint`.
- `supabase db reset` – Rebuild local Supabase (if using the CLI sandbox).
- `python rag_system/test_api.py` – Quick smoke test of the RAG API.
- `npm run build` (detector) – Package the Electron app.

## Troubleshooting
- **API 404/timeout:** Ensure `ML_SERVER_URL`, `RAG_API_URL`, and `NEXT_PUBLIC_DETECTOR_URL` are reachable; the Next.js dev server logs proxy failures.
- **Detector warnings in exams:** The student client polls `NEXT_PUBLIC_DETECTOR_URL`. Run the detector app before starting an exam or adjust the URL for headless mode.
- **Azure authentication errors:** Verify deployment names and API versions in `rag_system/.env`; the service falls back to `.env` defaults only when all keys are present.
- **WebRTC stream not connecting:** Confirm Supabase Realtime is enabled for your project and the student browser can reach the STUN server (`stun.l.google.com:19302`).

## Contributing
- Favor small, focused commits; lint and format before pushing.
- Keep comments concise and only where logic is non-obvious.
- Update this README when introducing new services, environment variables, or migrations.

## License
This repository currently has no explicit license. Add one if you plan to distribute or open-source the project.

