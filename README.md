# HireSense AI - Architecture & Setup

## Overview

HireSense AI is an intelligent recruitment, automated candidate evaluation, and adaptive technical assessment platform. It includes:
- **Core Full-Stack Platform** (`frontend/` & `backend/`)
- **Conversational AI Voice & Video Interview Suite** (`interview-module/`)
- **Live AI Camera Proctoring Companion** (`proctoring/`)

---

## Service Startup Commands

### 1. AI Voice & Video Interview Module (Port 3000)
The Interview Module powers adaptive real-time conversational voice interviews, resume intake analysis, and automated candidate grading.

**From Root Directory:**
```bash
npm run dev:interview
# OR
npm run start:interview
```

**Or directly inside the module directory:**
```bash
# Option A (Standard module):
cd interview-module
npm start
# OR
node server.js

# Option B (Final_Interview_Module):
cd Final_Interview_Module
npm start
# (Note: Use 'npm start' which executes through 'interview-platform')
```
> The interview module runs on **http://localhost:3000**.  
> Test connectivity via health check: `http://localhost:3000/api/health`.

---

### 2. Full-Stack Web Application

#### Backend API (Port 5000)
```bash
cd backend
npm run dev
```
> Runs the Express/Prisma API server on **http://localhost:5000**.

#### Frontend UI (Port 5173)
```bash
cd frontend
npm run dev
```
> Runs the Vite/React application on **http://localhost:5173**.

---

### 3. Live AI Proctoring Companion (Port 8765)
The proctoring service tracks candidate presence, head yaw, pupil gaze direction, multiple faces, and prohibited devices (mobile phones/laptops).

```bash
cd proctoring
python session_monitor_pro.py --server
```
> Runs the local proctoring companion HTTP service on **http://localhost:8765**.

---

## Architectural Decisions

1. **Google Identity Services (GIS) Exclusively for Users**: 
   - Students and recruiters authenticate via Google OAuth. Tokens are verified server-side using `google-auth-library`.

2. **Isolated Admin Authentication**:
   - Admins use dedicated Email/Password credentials and an isolated `Admin` database model.

3. **Multi-Stage Onboarding & The `PENDING` State**:
   - First-time OAuth logins start in `PENDING` status. The `<ProtectedRoute>` redirects them to `/onboarding/role` until their profile details are saved.

4. **JWT Rotation & HTTP-Only Cookies**:
   - Short-lived Access Tokens (15m) paired with secure `HttpOnly` Refresh Tokens (7d) prevent XSS exposure.

5. **Prisma & Normalized Data Models**:
   - Relational schemas partition `User`, `Student`, `Recruiter`, `JobApplication`, and test attempts with cascade rules and data integrity.
