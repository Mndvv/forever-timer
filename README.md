# ⏱️ Forever Timer

**Forever Timer** is a minimal, ultra-fast, and real-time debate timer designed specifically for **OBS Studio** live streams and stage events. It features a remote web controller and a transparent overlay, synchronized perfectly via WebSockets.

Inspired by tools like Stagetimer.io, but built as a lightweight, self-hosted, no-BS monorepo.

---

## 🤖 Context for AI Agents (MUST READ)

If you are an AI assistant (Cursor, Windsurf, Copilot, etc.) assisting with this codebase, **read this carefully**:

1. **Project Goal:** Build a fully functional MVP of a remote-controlled OBS timer.
2. **Server-Side Source of Truth:** The timer logic (`setInterval`, `timeRemaining`) lives strictly on the **Backend**. Clients (Frontend) merely display what the backend broadcasts via WebSocket. This prevents client desync.
3. **No Slop & No Over-engineering:** 
   - **NO DATABASES:** State is stored in-memory on the Node/Bun server. A server restart resetting the timer is the intended behavior.
   - **NO AUTHENTICATION:** This is for local/private network production use.
   - **NO COMPLEX STATE MANAGERS:** Do not use Pinia or Redux. Use native Vue Reactivity (`ref`, `reactive`, `useState`).
4. **OBS First:** The `/overlay` route must be strictly styled for OBS (transparent background, no scrollbars, high-contrast dynamic text colors based on remaining time).

---

## 🛠️ Tech Stack

This project is built using modern, fast, and minimal tooling:

- **Runtime & Package Manager:** [Bun](https://bun.sh/)
- **Backend:** [ElysiaJS](https://elysiajs.com/) (WebSockets & In-memory state)
- **Frontend:** [Nuxt.js](https://nuxt.com/) (v4.5.2+ / Vue 3 Composition API)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)

---

## 📁 Monorepo Structure

```text
forever-timer/
├── backend/          # ElysiaJS Server (WebSocket Hub & Timer Logic)
│   ├── src/index.ts  # Core server and WS implementation
│   └── package.json
├── frontend/         # NuxtJS Application (Controller & OBS Overlay)
│   ├── pages/
│   │   ├── index.vue       # The Controller (Dashboard)
│   │   └── overlay.vue     # The OBS Browser Source screen
│   ├── composables/
│   │   └── useTimerSocket.ts # WebSocket client connection logic
│   └── package.json
├── agents.md         # Strict rules & guidelines for AI Agents
└── README.md
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# In the backend directory
cd backend
bun install

# In the frontend directory
cd ../frontend
bun install
```

### 2. Run Concurrently
From the project root:
```bash
bun dev
```
Or start each service independently in separate terminals:
```bash
# Terminal 1: Backend (Elysia WebSocket server on port 8080)
cd backend
bun run dev

# Terminal 2: Frontend (Nuxt app on port 3000)
cd frontend
bun run dev
```

---

## 📺 OBS Studio Setup
1. In OBS, add a new **Browser Source**.
2. Set URL to: `http://localhost:3000/overlay`
3. Set Width: `1920`
4. Set Height: `1080`
5. Check **"Shutdown source when not visible"** (optional) and leave **"Custom CSS"** blank (transparency is already built-in).
6. Open `http://localhost:3000` in any browser (or mobile device on your local network) to control the timer!