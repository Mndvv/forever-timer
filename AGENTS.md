# OBS Debate Timer Project - AI Agent Instructions

## 🎯 Role & Context
You are an expert Fullstack Web Developer specializing in real-time applications, OBS Web-overlays, and modern JavaScript ecosystems. 
Your task is to build a real-time debate timer for OBS (similar to stagetimer.io) using a monorepo structure.

## 🛠 Tech Stack
- **Package Manager:** Bun
- **Backend:** ElysiaJS (running on Bun)
- **Frontend:** Nuxt.js (v4.5.2, latest) + Vue 3 Composition API
- **Styling:** Tailwind CSS (v3 or v4) + Tailwind Merge / clsx (if needed)
- **Communication:** Native WebSockets (ws)

## 📁 Project Structure
The project is a monorepo with the following existing directories:
- `./frontend` (Nuxt 4 app)
- `./backend` (Elysia app)

## 🚫 STRICT RULES & ANTI-SLOP GUIDELINES (READ CAREFULLY)
1. **NO OVER-ENGINEERING:** Keep it incredibly simple. 
2. **NO DATABASES:** Use **in-memory state** on the backend. If the server restarts, the state resets. That is 100% fine.
3. **NO AUTHENTICATION:** This is for local/private production use. Do not build login systems.
4. **NO COMPLEX STATE MANAGERS:** In Nuxt, use simple `ref()`, `reactive()`, or Nuxt's native `useState()`. Do not install Pinia unless absolutely necessary.
5. **OBS FIRST:** The overlay route MUST be fully transparent (`bg-transparent`) and responsive to 1920x1080 without scrollbars.
6. **SOURCE OF TRUTH:** The Backend (Elysia) is the absolute source of truth for the timer. It ticks and broadcasts the current remaining time. Do not rely on client-side `setInterval` for the actual countdown to prevent desync between controller and OBS.

---

## 🏗️ Architecture & Features to Build

### 1. Backend (ElysiaJS - `./backend`)
Create a simple WebSocket server with in-memory state.
- **State variables:**
  - `timeRemaining` (integer, in seconds)
  - `status` (string: 'idle', 'running', 'paused')
  - `speakerName` (string)
- **WebSocket Events to Handle (Receive from Controller):**
  - `SET_TIME`: payload `{ seconds: number }`
  - `START`: starts the timer interval on the server.
  - `PAUSE`: clears the server interval.
  - `RESET`: sets time back to 0 or last set time, clears interval.
  - `SET_SPEAKER`: payload `{ name: string }`
- **WebSocket Broadcasts (Send to all clients):**
  - Send `{ type: 'TICK', timeRemaining, status, speakerName }` every 1 second when running, or immediately upon state change.

### 2. Frontend (Nuxt.js - `./frontend`)
Create a shared WebSocket composable (`composables/useTimerSocket.ts`) that connects to the Elysia backend.

**Create two main routes/pages:**

#### A. The Controller (`/` or `/controller`)
The dashboard for the operator.
- **UI Elements:**
  - Display current synced `timeRemaining` (format MM:SS).
  - Input field for `speakerName`.
  - Buttons: `[Start]`, `[Pause]`, `[Reset]`.
  - Quick Set Buttons: `[3 Min]`, `[5 Min]`, `[7 Min]`, `[+1 Min]`.
- **Styling:** Clean, dark mode UI using Tailwind.

#### B. The OBS Overlay (`/overlay`)
The screen that will be added to OBS Browser Source.
- **UI Elements:**
  - Minimalist layout. Big, highly legible bold font (e.g., using Tailwind's `font-sans` or imported Google Font like 'Inter' or 'Roboto Mono').
  - Shows `speakerName` (top, medium size).
  - Shows `timeRemaining` (center, massive size, e.g., `text-8xl` or `text-9xl`).
- **Dynamic Styling (Crucial for Debate):**
  - The text/background color MUST change based on `timeRemaining`:
    - **Default/Safe:** Green (`text-green-500` or `text-white`)
    - **Warning (<= 30 seconds):** Yellow (`text-yellow-400`)
    - **Danger (<= 5 seconds) & Time Up:** Red (`text-red-500` + optional subtle pulse animation `animate-pulse` when hitting 0).
- **OBS Specifics:**
  - `<style> body { background-color: transparent !important; overflow: hidden; } </style>`

---

## 🚀 Execution Steps for the AI
1. Initialize the Elysia WebSocket server in `./backend/src/index.ts`. Implement the in-memory timer logic.
2. Initialize Tailwind and Nuxt structure in `./frontend`.
3. Build the `useTimerSocket` composable to handle connection and reconnection logic.
4. Build the `/overlay` page with dynamic Tailwind color classes based on time.
5. Build the `/controller` page with simple Tailwind buttons emitting WS events.
6. Provide instructions on how to run both concurrently using Bun.

**Begin implementation starting with the backend WebSocket logic.**