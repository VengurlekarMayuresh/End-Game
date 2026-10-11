# AI Interview Platform (Node.js)

Flow: **intake page** (job description + resume) -> AI parses and saves to the database -> candidate reviews details -> **adaptive voice interview** -> **recruiter report** saved to the database.

## Run
Requires **Node.js 22.13 or newer** (uses Node's built-in SQLite, so nothing needs compiling — works on Windows without Visual Studio).
1. `npm install`
2. `cp .env.example .env` (Windows: `copy .env.example .env`) and paste your Groq key (https://console.groq.com)
3. From the repository root, start the local proctoring companion in a separate terminal: `python proctoring\session_monitor_pro.py --server`
4. `npm start`, then open http://localhost:3000/intake.html (use localhost or HTTPS — browsers block camera and microphone access otherwise)

The interview room requires camera consent before it can start. It checks that the local proctoring companion is available, then starts camera monitoring with the interview and stops it when the interview ends. The live camera preview and proctoring alerts appear inside the interview page; alerts appear as short-lived notices and the companion does not open a separate camera window. Violation events are recorded in the proctoring session summary, and flagged screenshots are stored locally in the `proctoring` directory.

## Files
- `server.js` – interview API, adaptive difficulty, LLM client (OpenAI-compatible), anti-repeat memory
- `intake.js` – intake API (PDF/DOCX/TXT parsing, LLM extraction), SQLite storage, interview result saving
- `public/intake.html` – job description + resume form and review step
- `public/index.html` – interview room + recruiter report (opened as `index.html?candidate=<id>`)
- `data/app.db` – created automatically (tables: `jobs`, `candidates`, `interviews`)

## Database
SQLite is used so it runs with zero setup. All queries live in `intake.js` (`getCandidate`, `saveInterview`, `loadReport` and the two intake routes);
to use PostgreSQL/MySQL/MongoDB, re-implement those functions with your driver — nothing else touches the database.

## Scoring
Examples are optional. Answers of 1–3 words score at most 2/10; one clear, correct sentence can score up to about 7; fuller reasoning scores higher.

## Before real candidates
- Candidate ids are random and act as the interview link. Add real authentication/invite tokens.
- Add recruiter login to `GET /api/interview/:id/report` and the `/api/health` route, and store recruiter decisions (see `rv.rec` in the page).
- `resume_text` and contact details are personal data: add retention/deletion rules, encryption at rest, and access control (GDPR / India DPDP).
- Sessions are in memory; restart loses live interviews (finished results are in the database).
- Free LLM tiers are rate-limited and may use data for training — review the provider's terms.

## Troubleshooting
- Open http://localhost:3000/api/health to see the real LLM error (bad key, retired model, rate limit).
- Model names change; check https://console.groq.com/docs/models and update GEN_MODEL / GRADE_MODEL in .env, then restart.
- Windows: keep the project outside OneDrive-synced folders (e.g. C:\dev\interview-platform) — OneDrive locks files inside node_modules and npm fails with EPERM.
- Scanned (image-only) PDFs cannot be read; paste the text or upload a text-based file.
