# 🏒 Air Hockey — Client

**Real-time multiplayer air hockey, playable in the browser.**

A high-performance web application that delivers a smooth, responsive air hockey
experience over WebSockets. Players create or join game rooms, compete in
real-time 1v1 matches, and track scores — all from a mobile or desktop browser
with zero installs required.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Networking & Protocol](#networking--protocol)
- [Performance Optimizations](#performance-optimizations)
- [Deployment](#deployment)
- [License](#license)

---

## Overview

Börjessons Air Hockey is a client–server multiplayer game designed for
commercial distribution. The client is a single-page application built with
**React 18**, **TypeScript**, and **HTML5 Canvas**. It communicates with a
dedicated [Spring Boot game server](https://github.com/Rinbo/air-hockey-server)
over a custom binary WebSocket protocol for game state synchronization and
STOMP/WebSocket for lobby and chat functionality.

The project prioritizes low-latency input handling, efficient rendering, and a
mobile-first user experience.

---

## Features

| Category              | Details                                                                               |
| --------------------- | ------------------------------------------------------------------------------------- |
| **Multiplayer**       | Real-time 1v1 matches with server-authoritative game state                            |
| **Game Lobby**        | Create rooms, browse available games, join with one tap                               |
| **Live Chat**         | In-lobby chat via STOMP messaging                                                     |
| **Score Tracking**    | Per-match and cumulative score display with winner announcement                       |
| **Touch & Mouse**     | Full support for both pointer and touch input with drag-based handle control          |
| **Responsive Canvas** | Board dynamically resizes to fit any viewport while preserving the 0.625 aspect ratio |
| **Online Presence**   | See who is currently online                                                           |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Client (this repo)                   │
│                                                          │
│  Landing Page → Lobby → Game Canvas                      │
│       │            │          │                           │
│       │      STOMP/WS     Binary WS                      │
│       │     (chat, state)  (board-state @ 50 Hz)         │
│       │            │          │                           │
└───────┼────────────┼──────────┼───────────────────────────┘
        │            │          │
        ▼            ▼          ▼
┌──────────────────────────────────────────────────────────┐
│              Game Server (air-hockey-server)              │
│                                                          │
│  REST API · STOMP Broker · Binary WebSocket Handler      │
│  Game Engine · Physics · Collision Detection              │
└──────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer                 | Technology                                              |
| --------------------- | ------------------------------------------------------- |
| **Language**          | TypeScript 4.9                                          |
| **UI Framework**      | React 18                                                |
| **Routing**           | React Router v6                                         |
| **Build Tool**        | Vite 4                                                  |
| **Canvas Rendering**  | HTML5 Canvas 2D API                                     |
| **WebSocket (game)**  | Native `WebSocket` with binary (`ArrayBuffer`) protocol |
| **WebSocket (lobby)** | STOMP over SockJS (`@stomp/stompjs`)                    |
| **Form Handling**     | React Hook Form + Zod validation                        |
| **Styling**           | Tailwind CSS 3                                          |
| **Formatting**        | Prettier                                                |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A running instance of
  [air-hockey-server](https://github.com/Rinbo/air-hockey-server) (or use the
  hosted production server)

### Installation

```bash
git clone https://github.com/Rinbo/borjessons-air-hockey.git
cd borjessons-air-hockey
npm install
```

### Development

```bash
npm run dev
```

The dev server starts at `http://localhost:5173` and connects to the backend
configured in `.env.development`.

### Production Build

```bash
npm run build
```

Output is written to `dist/`.

---

## Project Structure

```
src/
├── api/               # REST API client utilities
├── assets/svg/        # SVG icons (play, share, wifi, etc.)
├── components/        # Reusable UI components
│   ├── buttons/       #   Button variants (icon button, etc.)
│   ├── canvas/        #   Canvas wrapper
│   ├── form/          #   Form components with validation
│   ├── game/          #   Score banner, game-specific UI
│   ├── misc/          #   Layout helpers (center wrapper, etc.)
│   ├── modal/         #   Modal dialogs
│   └── users/         #   User list / online users
├── config/            # Runtime properties (API URLs)
├── css/               # Global styles, landing background
├── game/              # Core game engine (client-side)
│   ├── board.ts       #   Board: canvas rendering, interpolation
│   ├── constants.ts   #   Game constants (aspect ratio, radii, etc.)
│   ├── game-websocket.ts  #   Binary WebSocket client
│   ├── input.ts       #   Input abstraction
│   ├── opponent-handle.ts #   Opponent handle rendering
│   ├── player-handle.ts   #   Player handle with touch/mouse input
│   ├── puck.ts        #   Puck rendering
│   └── utils.ts       #   Sprite generation, gradient helpers
├── hooks/             # Custom React hooks (window size, etc.)
├── routes/            # Page-level components (React Router)
│   ├── choose-a-name/ #   Username entry
│   ├── error/         #   Error boundary page
│   ├── games/         #   Game lobby, room, active game
│   └── landing/       #   Home / landing page
├── utils/             # General utilities (WebSocket helpers, etc.)
└── main.tsx           # Application entry point & router config
```

---

## Networking & Protocol

### Binary WebSocket — Board State (High Frequency)

The game board state is transmitted over a **raw binary WebSocket** to minimize
protocol overhead and latency. Data is encoded as `Float64Array` values in
little-endian byte order:

| Direction           | Payload                                                  | Size     |
| ------------------- | -------------------------------------------------------- | -------- |
| **Server → Client** | `[opponentX, opponentY, puckX, puckY, remainingSeconds]` | 40 bytes |
| **Client → Server** | `[handleX, handleY]`                                     | 16 bytes |

Connection URL: `ws://<host>/ws/game/{gameId}/{agency}`

### STOMP over SockJS — Lobby, Chat, Game Events

Lower-frequency events (player list updates, chat messages, game state
transitions) use STOMP messaging. Topics include:

- `/topic/game/{id}/chat` — chat messages
- `/topic/game/{id}/players` — player roster updates
- `/topic/game/{id}/game-state` — state machine transitions (lobby → running →
  score screen)
- `/topic/games` — available game list broadcast

---

## Performance Optimizations

The client implements several techniques to ensure smooth 60 FPS gameplay:

- **`requestAnimationFrame` render loop** — rendering is decoupled from the
  WebSocket tick rate, providing a consistent frame rate independent of network
  jitter
- **Client-side interpolation** — positions are linearly interpolated between
  the two most recent server states, smoothing movement at the visual level
- **Pre-rendered sprite caching** — handle and puck graphics are drawn once to
  off-screen canvases and reused via `drawImage`, avoiding redundant
  gradient/path operations per frame
- **Throttled React state updates** — the game timer only triggers a React
  re-render when the displayed second actually changes, preventing render
  thrashing during gameplay
- **Touch/pointer event optimization** — input listeners are managed with proper
  cleanup to prevent memory leaks

---

## License

Copyright © 2023–2026 Börjessons. All rights reserved.
