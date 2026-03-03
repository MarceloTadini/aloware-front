# Aloware Health — Voice Agent Admin UI

A React admin dashboard to configure and test the **Aloware Health** AI voice receptionist in real time, without restarting the backend.

---

## Overview

The system has two independent pieces:

| Layer | Tech | Role |
|---|---|---|
| **Backend** | Python · LiveKit Agents · FastAPI | Runs the live voice pipeline and exposes a config API |
| **Frontend** | React 19 · TypeScript · Vite · Tailwind CSS | Admin UI to edit the agent config and test calls |

Changes saved in the UI are written to `config.json` on the backend. The agent picks them up on the next incoming call — no restart required.

---

## Architecture

```
┌─────────────────────────────────────────┐
│  Browser (localhost:5173)               │
│  AdminDashboard.tsx                     │
│    └─ api.ts  ──── PATCH /config ──────►│
│    └─ TestCallWidget.tsx ── GET /token ─►│
└───────────────────┬─────────────────────┘
                    │ HTTP
┌───────────────────▼─────────────────────┐
│  FastAPI  (localhost:8000)              │
│  api.py — /config, /token, /health      │
│    └─ reads/writes config.json          │
└───────────────────┬─────────────────────┘
                    │ LiveKit SDK
┌───────────────────▼─────────────────────┐
│  LiveKit Agents worker                  │
│  agent.py                               │
│    VAD (OpenAI) → STT (Deepgram)        │
│    → LLM (GPT-4o) → TTS (Cartesia)     │
│    → tools.py (clinic tools)            │
└─────────────────────────────────────────┘
```

---

## Frontend — Source structure

```
src/
├── main.tsx                  # React entry point
├── App.tsx                   # Renders <AdminDashboard>
├── api.ts                    # HTTP service layer (getConfig, patchConfig, getToken)
├── index.css                 # Tailwind base + .input component + toast animation
└── components/
    ├── AdminDashboard.tsx    # Main page: settings form, tools, sidebar
    └── TestCallWidget.tsx    # LiveKit browser call widget (Start / End Call)
```

### `api.ts`

Three exported functions, all targeting `http://localhost:8000`:

| Function | Method | Endpoint | Purpose |
|---|---|---|---|
| `getConfig()` | GET | `/config` | Load the current agent config on mount |
| `patchConfig(data)` | PATCH | `/config` | Save partial or full config updates |
| `getToken(room, identity)` | GET | `/token` | Get a LiveKit JWT for test calls |

### `AdminDashboard.tsx`

Single-page form with:
- **General section** — Agent Name, Voice Persona (dropdown + custom UUID field), Greeting
- **System Prompt section** — full-height monospace textarea for LLM instructions
- **Enabled Tools section** — checkboxes for `check_availability`, `book_appointment`, `transfer_to_human`
- **Save Changes** button in the sticky header — sends a `PATCH /config` request
- **Toast notifications** — green on success, red on failure, auto-dismiss after 4 s
- **Test Call widget** in the sidebar (see below)

### `TestCallWidget.tsx`

Connects the browser microphone to the LiveKit room where the agent is running:
1. Calls `GET /token` to obtain a JWT and the LiveKit server URL
2. Opens a `livekit-client` `Room` and enables the microphone
3. Shows a pulsing indicator while speaking
4. "End Call" disconnects cleanly

---

## Frontend setup

### Prerequisites

- Node.js 18+ and Yarn

### 1 — Install dependencies

```bash
cd frontend/aloware
yarn install
```

### 2 — Start the dev server

```bash
yarn run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Available scripts

```bash
yarn run dev       # Development server with HMR
yarn run build     # Type-check (tsc) then bundle (Vite)
yarn run lint      # ESLint
yarn run preview   # Serve the production build locally
```

---

## Tech stack

| Concern | Library / Tool |
|---|---|
| UI framework | React 19 |
| Language | TypeScript (strict mode) |
| Build tool | Vite 7 |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite`) |
| Browser calls | `livekit-client` v2 |
| Linting | ESLint 9 flat config + typescript-eslint |
| Voice pipeline | LiveKit Agents, OpenAI GPT-4o, Deepgram STT, Cartesia TTS |
