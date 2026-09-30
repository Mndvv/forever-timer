# Graph Report - forevertimer  (2026-10-01)

## Corpus Check
- 20 files · ~11,566 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 3, .lock 2, .css 1)

## Summary
- 307 nodes · 410 edges · 20 communities (15 shown, 5 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 27 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `dd8dafc5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- index.vue
- index.ts
- frontend/package.json
- useTimerSocket
- dependencies
- useTimerSocket.ts
- overlay.vue
- backend/package.json
- compilerOptions
- OBS Debate Timer Project - AI Agent Instructions
- scripts
- ⏱️ Forever Timer
- Nuxt Minimal Starter
- setTime
- emitConfigUpdate
- backend/README.md
- frontend/tsconfig.json

## God Nodes (most connected - your core abstractions)
1. `useTimerSocket()` - 30 edges
2. `send()` - 26 edges
3. `broadcast()` - 24 edges
4. `compilerOptions` - 13 edges
5. `stopTimer()` - 9 edges
6. `getActiveTimer()` - 8 edges
7. `OBS Debate Timer Project - AI Agent Instructions` - 7 edges
8. `scripts` - 6 edges
9. `⏱️ Forever Timer` - 6 edges
10. `startTimer()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `🚀 Execution Steps for the AI` --references--> `useTimerSocket()`  [INFERRED]
  AGENTS.md → frontend/app/composables/useTimerSocket.ts
- `adjustSeconds()` --calls--> `setTime()`  [EXTRACTED]
  frontend/app/pages/index.vue → frontend/app/composables/useTimerSocket.ts
- `onScrubberChange()` --calls--> `setTime()`  [EXTRACTED]
  frontend/app/pages/index.vue → frontend/app/composables/useTimerSocket.ts
- `onScrubberInput()` --calls--> `setTime()`  [EXTRACTED]
  frontend/app/pages/index.vue → frontend/app/composables/useTimerSocket.ts
- `updateActiveSpeaker()` --calls--> `setSpeaker()`  [EXTRACTED]
  frontend/app/pages/index.vue → frontend/app/composables/useTimerSocket.ts

## Import Cycles
- None detected.

## Communities (20 total, 5 thin omitted)

### Community 0 - "index.vue"
Cohesion: 0.04
Nodes (36): activeTab, activeTimerIndex, audioFileInput, copied, desktopSideTab, flashClass, handleAudioUpload(), handleDeletePreset() (+28 more)

### Community 1 - "index.ts"
Cohesion: 0.10
Nodes (39): addCustomSound(), addRule(), addTimer(), AlertRule, app, broadcast(), clients, config (+31 more)

### Community 2 - "frontend/package.json"
Cohesion: 0.06
Nodes (34): typescript, name, private, scripts, build, dev, generate, postinstall (+26 more)

### Community 3 - "useTimerSocket"
Cohesion: 0.12
Nodes (31): useTimerSocket(), addCustomSound(), addRule(), addTimer(), connect(), deleteCustomSound(), deletePreset(), deleteRule() (+23 more)

### Community 4 - "dependencies"
Cohesion: 0.07
Nodes (28): dependencies, eslint, jszip, nuxt, @nuxt/eslint, @nuxt/image, @nuxt/ui, tailwindcss (+20 more)

### Community 5 - "useTimerSocket.ts"
Cohesion: 0.12
Nodes (18): AlertRule, CustomSound, defaultTimerConfig, SoundConfig, TimerAppearanceConfig, TimerConfig, TimerItem, TimerMessage (+10 more)

### Community 6 - "overlay.vue"
Cohesion: 0.12
Nodes (19): testSound(), audioNeedsInteraction, containerStyle, flashClass, mainTimerShadowStyle, overtimeBadgeStyle, overtimeContainerClasses, overtimeContainerStyle (+11 more)

### Community 7 - "backend/package.json"
Cohesion: 0.11
Nodes (17): app, dependencies, elysia, @elysiajs/cors, devDependencies, @types/bun, typescript, typescript (+9 more)

### Community 8 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, forceConsistentCasingInFileNames, lib, module, moduleDetection, moduleResolution, noEmit, noUncheckedIndexedAccess (+5 more)

### Community 9 - "OBS Debate Timer Project - AI Agent Instructions"
Cohesion: 0.17
Nodes (11): 1. Backend (ElysiaJS - `./backend`), 2. Frontend (Nuxt.js - `./frontend`), A. The Controller (`/` or `/controller`), 🏗️ Architecture & Features to Build, B. The OBS Overlay (`/overlay`), 🚀 Execution Steps for the AI, OBS Debate Timer Project - AI Agent Instructions, 📁 Project Structure (+3 more)

### Community 10 - "scripts"
Cohesion: 0.22
Nodes (8): name, private, scripts, build:frontend, dev, dev:backend, dev:frontend, workspaces

### Community 11 - "⏱️ Forever Timer"
Cohesion: 0.22
Nodes (8): 1. Install Dependencies, 2. Run Concurrently, 🤖 Context for AI Agents (MUST READ), ⏱️ Forever Timer, 📁 Monorepo Structure, 📺 OBS Studio Setup, 🚀 Quick Start, 🛠️ Tech Stack

### Community 12 - "Nuxt Minimal Starter"
Cohesion: 0.40
Nodes (4): Development Server, Nuxt Minimal Starter, Production, Setup

### Community 13 - "setTime"
Cohesion: 0.50
Nodes (4): setTime(), adjustSeconds(), onScrubberChange(), onScrubberInput()

### Community 14 - "emitConfigUpdate"
Cohesion: 0.50
Nodes (4): emitConfigUpdate(), removeRule(), resetConfigToDefaults(), saveNewRule()

## Knowledge Gaps
- **170 isolated node(s):** `app`, `name`, `type`, `start`, `dev` (+165 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 187 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vue` connect `useTimerSocket.ts` to `index.vue`, `frontend/package.json`, `overlay.vue`?**
  _High betweenness centrality (0.198) - this node is a cross-community bridge._
- **Why does `useTimerSocket()` connect `useTimerSocket` to `OBS Debate Timer Project - AI Agent Instructions`, `setTime`, `useTimerSocket.ts`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `frontend/package.json`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Are the 26 inferred relationships involving `useTimerSocket()` (e.g. with `🚀 Execution Steps for the AI` and `addCustomSound()`) actually correct?**
  _`useTimerSocket()` has 26 INFERRED edges - model-reasoned connections that need verification._
- **What connects `app`, `name`, `type` to the rest of the system?**
  _170 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10256410256410256 - nodes in this community are weakly interconnected._