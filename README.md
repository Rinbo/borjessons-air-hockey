# 🏒 Air Hockey — Client

**Real-time multiplayer air hockey, playable in the browser.**

A high-performance web application that delivers a smooth, responsive air hockey
experience over WebSockets. Players create or join game rooms, compete in
real-time 1v1 matches, or play against an AI — all from a mobile or desktop
browser with zero installs required.

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
- [Testing](#testing)
- [Deployment](#deployment)
- [License](#license)

---

## Overview

Börjessons Air Hockey is a client–server multiplayer game designed for
commercial distribution. The client is a single-page application built with
**vanilla TypeScript**, **HTML5 Canvas**, and a custom **CSS design system**
following a Nordic Minimal aesthetic. It communicates with a dedicated
[Spring Boot game server](https://github.com/Rinbo/air-hockey-server) over a
custom binary WebSocket protocol for game state synchronization and
STOMP/WebSocket for lobby and chat functionality.

The project prioritizes low-latency input handling, efficient rendering, and a
mobile-first user experience. The architecture is designed to be easily
adaptable for a future PixiJS rendering layer.

---

## Features

| Category              | Details                                                                               |
| --------------------- | ------------------------------------------------------------------------------------- |
| **Multiplayer**       | Real-time 1v1 matches with server-authoritative game state                            |
| **Single Player**     | Play against a built-in AI bot directly from the game lobby                           |
| **Game Lobby**        | Create rooms, browse available games, join with one tap                               |
| **Live Chat**         | In-lobby chat via STOMP messaging with per-user color coding                          |
| **Score Tracking**    | Per-match and cumulative score display with winner announcement                       |
| **Touch & Mouse**     | Full support for both pointer and touch input with drag-based handle control          |
| **Responsive Canvas** | Board dynamically resizes to fit any viewport while preserving the 0.625 aspect ratio |
| **Online Presence**   | See who is currently online                                                           |
| **Board Graphics**    | High-fidelity ice-rink surface with cross-hatch scratches, 3D goals, and vignette      |

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
│  Game Engine · Physics · Collision Detection · AI Bot     │
└──────────────────────────────────────────────────────────┘
```

Each page is a TypeScript module exporting `mount(container)` and `unmount()`
lifecycle methods, managed by a lightweight hash-based router. This pattern maps
directly to future PixiJS scenes.

---

## Tech Stack

| Layer                 | Technology                                              |
| --------------------- | ------------------------------------------------------- |
| **Language**          | TypeScript 4.9                                          |
| **UI**                | Vanilla TypeScript (DOM manipulation)                   |
| **Routing**           | Custom hash-based router with `:id` params              |
| **Build Tool**        | Vite 4                                                  |
| **Testing**           | Vitest                                                  |
| **Canvas Rendering**  | HTML5 Canvas 2D API                                     |
| **WebSocket (game)**  | Native `WebSocket` with binary (`ArrayBuffer`) protocol |
| **WebSocket (lobby)** | STOMP over SockJS (`@stomp/stompjs`)                    |
| **Styling**           | Custom CSS design system (Nordic Minimal)               |
| **Typography**        | Inter (body) + Exo (display) via Google Fonts           |
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

Output is written to `dist/`. Production bundle: ~17 KB CSS + ~117 KB JS (~35 KB
gzipped).

---

## Project Structure

```
src/
├── api/               # REST API client utilities
├── assets/svg/        # SVG icons (play, share, wifi, send)
├── config/            # Runtime properties (API URLs from env)
├── game/              # Core game engine (framework-agnostic)
│   ├── board.ts       #   Board: canvas rendering, interpolation, ice-rink graphics
│   ├── constants.ts   #   Game constants (aspect ratio, radii, duration)
│   ├── game-websocket.ts  #   Binary WebSocket client
│   ├── input.ts       #   Input abstraction (touch/mouse)
│   ├── opponent-handle.ts #   Opponent handle rendering
│   ├── player-handle.ts   #   Player handle with touch/mouse input
│   ├── puck.ts        #   Puck rendering
│   ├── utils.ts       #   Sprite generation, gradient helpers
│   └── game-logic.test.ts #  Unit tests for game constants and logic
├── pages/             # Page controllers (mount/unmount lifecycle)
│   ├── landing.ts     #   Home page with hero title and navigation
│   ├── choose-name.ts #   Username entry with validation
│   ├── available-games.ts #   Browse and join games
│   ├── game-container.ts  #   Game state machine (lobby → game → score)
│   ├── game-view.ts   #   Canvas setup, score banner, rAF loop
│   ├── lobby.ts       #   Chat, ready toggle, FAB menu, AI button
│   ├── online-users.ts #   Online user grid with avatars
│   ├── generate-room.ts #  UUID room generation + redirect
│   └── error.ts       #   Error display
├── styles/            # CSS design system (Nordic Minimal)
│   ├── variables.css  #   Design tokens (colors, typography, spacing)
│   ├── base.css       #   Reset, global styles
│   ├── components.css #   Buttons, cards, forms, modals, FAB, toasts
│   ├── pages.css      #   Page-specific layouts
│   └── animations.css #   Particles, ripple, fades, transitions
├── utils/             # General utilities (WebSocket helpers, misc)
│   ├── misc-utils.test.ts #  Unit tests for utilities
│   ├── misc-utils.ts      #  Local storage and UUID helpers
│   ├── time-utils.ts      #  Date and time formatting
│   └── websocket-utils.ts #  Binary data parsing helpers
├── router.ts          # Hash-based router with param matching
├── router.test.ts     # Unit tests for the router
├── stomp-connection.ts # STOMP/SockJS connection manager
├── types.ts           # Shared types (GameState, Player, Message)
└── main.ts            # Entry point: style imports, route registration
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
- `/topic/game/{id}/players` — player roster updates (including scores)
- `/topic/game/{id}/game-state` — state machine transitions (lobby → running →
  score screen)
- `/topic/games` — available game list broadcast
- `/topic/users` — online user list updates

Action endpoints:
- `/app/game/{id}/add-ai` — adds an AI opponent to the game

---

## Performance Optimizations

The client implements several techniques to ensure smooth 60 FPS gameplay:

- **`requestAnimationFrame` render loop** — rendering is decoupled from the
  WebSocket tick rate, providing a consistent frame rate independent of network
  jitter
- **Client-side interpolation** — positions are linearly interpolated between
  the two most recent server states, smoothing movement at the visual level
- **High-Fidelity Rendering** — the ice surface features a linear gradient,
  subtle cross-hatch scratches, 3D goal rendering with net patterns, and an edge
  vignette for depth
- **Pre-rendered sprite caching** — handle and puck graphics are drawn once to
  off-screen canvases and reused via `drawImage`, avoiding redundant
  gradient/path operations per frame
- **Pre-rendered background** — the ice-rink surface, markings, and goals are
  composited once to an off-screen canvas and blitted per frame, eliminating
  repeated draw calls for static elements
- **Minimal DOM updates** — the game timer only updates the DOM when the
  displayed second changes; score updates are targeted element replacements
- **Touch/pointer event optimization** — input listeners are managed with proper
  cleanup to prevent memory leaks
- **Zero-dependency UI** — no framework runtime overhead; the entire production
  JS bundle is ~35 KB gzipped

---

## Testing

The project uses [Vitest](https://vitest.dev/) for unit testing game logic,
utility functions, and the router.

Run all tests:
```bash
npm test
```

Watch mode:
```bash
npm run test:watch
```

---

## License

Copyright © 2023–2026 Börjessons. All rights reserved.
