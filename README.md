# HireSense AI - Architecture & Setup

## Authentication & User Management (Module 1)

This repository forms the foundation of HireSense AI. Module 1 handles the core authentication, role-based access control, and user onboarding flows.

### Architectural Decisions

1. **Google Identity Services (GIS) Exclusively for Users**: 
   - **Why**: As requested, students and recruiters authenticate exclusively via Google. This eliminates the need for managing passwords, reduces security risks, and simplifies the login flow. We use `@react-oauth/google` on the frontend to get the JWT, and `google-auth-library` on the backend to rigorously verify the token signature directly with Google's servers.

2. **Isolated Admin Authentication**:
   - **Why**: Admins bypass OAuth and use traditional Email/Password authentication. This is intentional to ensure platform administrators can always access the system even if third-party OAuth providers experience downtime. Admins are stored in a completely isolated `Admin` table rather than mixing them with standard users.

3. **Multi-Stage Onboarding & The `PENDING` State**:
   - **Why**: When a user logs in via Google for the very first time, we don't know if they are a Student or a Recruiter. We create their `User` record with a `PENDING` status. The frontend's `<ProtectedRoute>` intercepts `PENDING` users and forces them into the Onboarding flow (`/onboarding/role`). Only after they complete their respective profile forms is their status upgraded to `ACTIVE` and their role locked in.

4. **JWT Rotation & HTTP-Only Cookies**:
   - **Why**: Storing long-lived JWTs in localStorage is a severe XSS security risk. We issue a short-lived (15m) Access Token (kept in memory/localStorage for immediate API authorization) and a long-lived (7d) Refresh Token stored in a secure, `HttpOnly`, `SameSite=strict` cookie. The frontend Axios interceptor automatically catches `401 Unauthorized` responses and silently calls the `/api/auth/refresh` endpoint to get a new Access Token without interrupting the user's experience.

5. **Prisma & Supabase**:
   - **Why**: The schema defines `User`, `Student`, and `Recruiter` in a normalized 1-to-1 relationship. This keeps the `User` table extremely lightweight (strictly for auth/routing) while the heavy, role-specific data is kept in the `Student` and `Recruiter` tables.

## Getting Started

1. Set your `GOOGLE_CLIENT_ID` in both `.env` files.
2. Set your Supabase `DATABASE_URL` and `DIRECT_URL` in `backend/.env`.
3. Run `npm run dev` in both the `frontend` and `backend` directories.
