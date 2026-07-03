# FlowChat

> Practice spoken English with a friendly AI partner — and get honest feedback after every conversation.

FlowChat is an AI English-speaking coach. You pick a scenario (or just start talking), chat by **text or voice**, and the AI keeps the conversation flowing naturally — **no mid-chat corrections, ever**. When you're done, tap **Get feedback** for a personalized debrief: a clarity score, filler words you leaned on, better phrasings, and one focus area for next time. Voice sessions also get pronunciation scoring (accuracy, fluency, prosody).

<p>
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs" />
  <img alt="React" src="https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white" />
  <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white" />
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-7-2d3748?logo=prisma&logoColor=white" />
  <img alt="Clerk" src="https://img.shields.io/badge/Auth-Clerk-6c47ff" />
</p>

---

## Table of contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
  - [1. Backend (FastAPI)](#1-backend-fastapi)
  - [2. Frontend (Next.js)](#2-frontend-nextjs)
- [Environment variables](#environment-variables)
- [Data model](#data-model)
- [API reference](#api-reference)
- [Project structure](#project-structure)
- [How it works](#how-it-works)

---

## Features

- **Text & voice chat** — type or speak; switch any time. Voice mode auto-detects when you stop talking and replies out loud.
- **No mid-chat corrections** — the AI reacts and asks follow-ups so you build confidence speaking freely.
- **Session feedback** — a per-conversation debrief with a clarity score, overused/filler words, "better phrasings" rewrites, and a single focus area.
- **Pronunciation scoring** — voice turns are graded on accuracy, fluency, and prosody, with specific sounds to work on.
- **Scenario starters** — job interview, restaurant, small talk, daily standup, travel/directions, or free chat.
- **Profile & progress** — total sessions, day streak, average/best clarity band, a clarity-over-time chart, recent sessions, and your most-used filler words.

## Architecture

FlowChat is a two-service app in a single repo:

```
┌─────────────────────────┐         ┌──────────────────────────┐
│  apps/web  (Next.js 16)  │  HTTP   │  apps/api  (FastAPI)      │
│                          │ ──────► │                          │
│  • UI + App Router pages │         │  • /chat   (Groq LLM)     │
│  • Route handlers (/api) │         │  • /debrief (Groq LLM)    │
│  • Clerk auth            │         │  • /transcribe (Whisper)  │
│  • Prisma  ──► Postgres  │         │  • /pronounce  (Gemini)   │
└─────────────────────────┘         └──────────────────────────┘
```

The **Next.js app** owns auth, the database, and the UI. Its `/api/*` route handlers persist conversations/messages/feedback with Prisma, then proxy the AI work to the **FastAPI service**, which is a thin, stateless wrapper around the model providers (Groq for chat + speech-to-text, Google Gemini for pronunciation assessment).

## Tech stack

| Layer      | Technology |
|------------|------------|
| Frontend   | Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS 4, Framer Motion, lucide-react |
| Auth       | Clerk (`@clerk/nextjs`), middleware-protected routes |
| Database   | PostgreSQL (Neon) via Prisma 7 with the `@prisma/adapter-pg` driver adapter |
| Backend    | FastAPI, Uvicorn, httpx |
| AI models  | Groq `llama-3.3-70b-versatile` (chat + debrief), Groq `whisper-large-v3-turbo` (transcription), Google `gemini-2.0-flash` (pronunciation) |

## Prerequisites

- **Node.js** 20+
- **Python** 3.11+
- A **PostgreSQL** database — a free [Neon](https://neon.tech) project works well
- API keys (all have free tiers):
  - [Clerk](https://dashboard.clerk.com) — authentication
  - [Groq](https://console.groq.com/keys) — chat + transcription
  - [Google AI Studio](https://aistudio.google.com) — Gemini, for pronunciation feedback

## Getting started

Clone the repo, then set up the two services. **Start the backend first** — the frontend proxies to it.

### 1. Backend (FastAPI)

```bash
cd apps/api
python -m venv venv

# Windows (PowerShell)
.\venv\Scripts\Activate.ps1
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env        # then fill in GROQ_API_KEY and GEMINI_API_KEY
uvicorn main:app --reload --port 8000
```

Verify it's up: <http://localhost:8000/health> → `{"status":"ok","service":"flowchat-api","version":"0.1.0"}`

### 2. Frontend (Next.js)

```bash
cd apps/web
npm install
cp .env.example .env.local   # then fill in Clerk keys + DATABASE_URL

# apply the schema to your database and generate the client
npx prisma migrate dev
npx prisma generate

npm run dev
```

Open <http://localhost:3000>.

> **Note:** The Prisma client is generated into `apps/web/generated/prisma` (gitignored). Run `npx prisma generate` after installing or whenever `prisma/schema.prisma` changes.

**Frontend scripts** (`apps/web/package.json`):

| Script | Command | Purpose |
|--------|---------|---------|
| `npm run dev`   | `next dev`   | Start the dev server on `:3000` |
| `npm run build` | `next build` | Production build |
| `npm run start` | `next start` | Serve the production build |
| `npm run lint`  | `eslint`     | Lint the codebase |

## Environment variables

### `apps/web/.env.local`

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Signing secret for the `/api/webhooks/clerk` user-sync webhook |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Sign-in route (`/sign-in`) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Sign-up route (`/sign-up`) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | Where to land after sign-in (`/chat`) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | Where to land after sign-up (`/chat`) |
| `DATABASE_URL` | PostgreSQL connection string (Neon pooled URL) |
| `NEXT_PUBLIC_API_URL` | Base URL of the FastAPI service (`http://localhost:8000`) |

### `apps/api/.env`

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Groq key — powers chat responses and Whisper transcription |
| `GEMINI_API_KEY` | Google Gemini key — powers voice pronunciation feedback |
| `FRONTEND_URL` | Comma-separated list of allowed CORS origins (`http://localhost:3000`) |

Secrets live only in `.env.local` / `.env` (both gitignored). Commit-safe templates are provided as `.env.example`.

## Data model

Defined in [`apps/web/prisma/schema.prisma`](apps/web/prisma/schema.prisma):

- **User** — `clerkId`, `email`, `name`; owns many conversations. Kept in sync with Clerk via webhook.
- **Conversation** — `title`, belongs to a user, has many messages and an optional feedback record.
- **Message** — `role` (`user` | `assistant`) and `content`, ordered by `createdAt`.
- **Feedback** — one per conversation: `clarityScore`, `summary`, `overusedWords` (JSON), `betterPhrasings` (JSON), `focusArea`.

Deletes cascade: removing a user removes their conversations, messages, and feedback.

## API reference

### Next.js route handlers (`apps/web/app/api`)

All require an authenticated Clerk session.

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/start` | Create a conversation seeded with a scenario's opener |
| `POST` | `/api/chat` | Append a user message and stream the assistant reply (`text/plain` stream); returns the conversation id in the `X-Conversation-Id` header |
| `POST` | `/api/debrief` | Generate & persist session feedback for a conversation |
| `POST` | `/api/transcribe` | Speech-to-text for a recorded audio blob |
| `POST` | `/api/pronounce` | Pronunciation scoring for a recorded audio blob |
| `PATCH` / `DELETE` | `/api/conversations/[conversationId]` | Rename or delete a conversation |
| `POST` | `/api/webhooks/clerk` | Clerk user lifecycle sync (`user.created` / `updated` / `deleted`) |

### FastAPI service (`apps/api/main.py`)

| Method | Route | Description |
|--------|-------|-------------|
| `GET`  | `/health` | Liveness check |
| `POST` | `/chat` | Stream a chat completion from the conversation history |
| `POST` | `/debrief` | Return structured feedback JSON for a transcript |
| `POST` | `/transcribe` | Transcribe uploaded audio (Whisper) |
| `POST` | `/pronounce` | Assess pronunciation of uploaded audio (Gemini) |

## Project structure

```
flowchat/
├─ apps/
│  ├─ web/                    # Next.js 16 frontend + API route handlers
│  │  ├─ app/
│  │  │  ├─ (auth)/           # Clerk sign-in / sign-up
│  │  │  ├─ (dashboard)/      # chat + profile (protected)
│  │  │  ├─ api/              # route handlers (chat, start, debrief, …)
│  │  │  ├─ layout.tsx
│  │  │  └─ page.tsx          # marketing landing page
│  │  ├─ components/          # Chat, ChatSidebar, FeedbackPanel, …
│  │  ├─ lib/                 # prisma, clarity bands, audio, topics, …
│  │  ├─ prisma/schema.prisma
│  │  └─ proxy.ts             # Clerk middleware (protects /chat, /dashboard)
│  └─ api/                    # FastAPI backend
│     ├─ main.py
│     └─ requirements.txt
└─ README.md
```

## How it works

1. **Sign in** with Clerk. A middleware (`apps/web/proxy.ts`) guards `/chat` and `/dashboard`; after auth you land on `/chat`.
2. **Start a session** — pick a scenario (which seeds the AI's opening line) or type your own first message.
3. **Chat** — each turn is saved to Postgres, then the full history is sent to the FastAPI `/chat` endpoint, which streams a Groq LLM response back token-by-token.
4. **Voice mode** — records a turn, transcribes it with Whisper, scores pronunciation with Gemini, and speaks the reply using the browser's speech synthesis.
5. **Get feedback** — the transcript goes to `/debrief`, which returns a clarity score, filler words, better phrasings, and a focus area; results are stored and surfaced on your **Profile**.
