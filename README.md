# Task Manager

A full‑stack Task Manager application with a React (Vite) frontend and a TypeScript/Express backend using Prisma ORM and JWT authentication.

## Features
- User registration and login with JWT
- Persistent auth with protected routes
- Create, update, delete, and list tasks
- User profile with statistics, level, streak
- Settings for profile updates and password change
- React Query data fetching and caching
- Tailwind + ShadCN UI

## Tech Stack
- Frontend: React 18, Vite, TypeScript, React Router, React Query, Tailwind, ShadCN
- Backend: Node.js, Express, TypeScript, Prisma, bcrypt, jsonwebtoken
- Database: PostgreSQL (Prisma)

## Prerequisites
- Node.js 18+
- A PostgreSQL database URL

## Setup
### 1) Backend (server)
1. `cd server`
2. Copy `.env.example` to `.env` and set values:
   - `PORT=4000`
   - `DATABASE_URL=your_postgres_url`
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` to secure random strings
   - `FRONTEND_URL=http://localhost:8080`
3. Install deps: `npm install`
4. Generate Prisma client: `npm run prisma:generate`
5. Apply migrations (dev): `npm run prisma:migrate`
6. Start dev server: `npm run dev` (runs on `http://localhost:4000`)

### 2) Frontend (client)
1. `cd client`
2. Ensure `.env` contains: `VITE_API_URL=http://localhost:4000`
3. Install deps: `npm install`
4. Start dev server: `npm run dev` (opens `http://localhost:8080`)

## Build & Run (production)
- Server: `cd server && npm run build && npm run start`
- Client: `cd client && npm run build` (serve `client/dist` via any static server)

## Useful Scripts
- Server: `npm run dev`, `npm run build`, `npm run start`, `npm run prisma:generate`, `npm run prisma:migrate`, `npm run prisma:deploy`
- Client: `npm run dev`, `npm run build`, `npm run preview`

## API Overview (selected)
- `POST /auth/register` — register user
- `POST /auth/login` — login, returns access token
- `GET /user/profile` — profile with stats
- `PUT /user/profile` — update name/email
- `PUT /user/change-password` — change password
- `GET /user/statistics` — task statistics
- `GET /tasks` / `POST /tasks` — list/create tasks
- `PUT /tasks/:id` / `DELETE /tasks/:id` — update/delete task

Auth: send `Authorization: Bearer <access_token>` header to protected endpoints.

## Notes
- Do not commit `.env` or database files; the server `.gitignore` is set to exclude them.
- Ensure CORS settings align with your frontend URL (`FRONTEND_URL`).