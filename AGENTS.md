# AGENT.md — kinetic-console

> Reference document for AI agents working on this codebase.
> Read this before writing any code. Rules here override general intuitions.

---

## Project Overview

**kinetic-console** is a mobile terminal application that connects to a local (or tunneled) proxy server and renders a full PTY session via xterm.js in a React Native WebView.

- The **mobile app** (Expo/React Native) is the client — it connects to a host, manages sessions, and displays the terminal.
- The **proxy server** (Node.js) runs on the user's machine — it spawns PTY processes (via `node-pty`), wraps them in tmux, and exposes them over WebSocket + HTTP.
- Connections work over LAN (direct IP) or through **Localtunnel / Cloudflare Tunnel** for remote access.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Mobile App | React Native, Expo ~55.0.0 |
| Terminal UI | WebView + xterm.js + fit-addon (`assets/terminal.html`) |
| State | React Context API (`TerminalContext`) |
| Storage | AsyncStorage |
| Navigation | React Navigation (Bottom Tabs + Native Stack) |
| Proxy Server | Node.js (CommonJS), `node-pty`, `ws` |
| Tunnel Support | Localtunnel (`.loca.lt`), Cloudflare (`.trycloudflare.com`) |

---

## Directory Structure

```
tui-app/
├── mobile-app/
│   ├── assets/
│   │   └── terminal.html           # xterm.js terminal — standalone HTML loaded in WebView
│   ├── components/
│   │   ├── ui/                     # Pure UI: SectionHeader, StatusDashboard, LogStrip
│   │   └── host/                   # Host/session UI: HostCard, SessionRow, QRScanner
│   ├── config/
│   │   ├── constants.js            # App-wide constants: STORAGE_KEYS, reconnect config
│   │   └── network.js              # TUNNEL_DOMAINS, BYPASS_HEADERS
│   ├── context/
│   │   └── TerminalContext.js      # Central state: connection, sessions, hosts, logs
│   ├── hooks/
│   │   ├── useHosts.js             # Host CRUD + AsyncStorage persistence
│   │   ├── useWS.js                # WebSocket lifecycle + exponential backoff reconnect
│   │   ├── useTerminal.js          # Terminal-specific logic
│   │   └── useLogger.js            # In-memory log buffer
│   ├── navigation/
│   │   └── AppNavigator.js         # Bottom tabs + HomeStack
│   ├── screens/                    # One file per screen (containers)
│   ├── theme/
│   │   └── theme.js                # C (color palette) + MONO (font)
│   └── utils/
│       └── url.js                  # resolveHost() — URL/WS resolution, Magic Link parsing
└── proxy-server/
    ├── config/
    │   └── index.js                # PORT, PROXY_SHELL, LOG_LEVEL — reads from env
    ├── services/
    │   ├── pty.service.js          # PTYService singleton — Map of active sessions
    │   ├── tmux.service.js         # tmux session listing and management
    │   ├── tunnel.service.js       # Tunnel provider startup (localtunnel/cloudflare)
    │   └── security.service.js    # Token validation
    └── index.js                    # HTTP + WebSocket server entry point
```

---

## Architecture Rules

These are non-negotiable. Breaking them creates technical debt that cascades.

### 1. Container-Presenter Pattern
- **Screens** = containers. They consume `TerminalContext`, call hooks, and pass data down.
- **Components** (`components/ui/`, `components/host/`) = presentational. They receive ALL data and callbacks via **props**. Zero business logic. Zero direct context access. Zero AsyncStorage calls.

### 2. Business Logic in Hooks
All business logic MUST live in custom hooks, not in components or screens:
- Data fetching, state derivation, async operations → hook
- If logic is used in more than one place → hook
- If logic mixes state + side effects → hook

### 3. Single Source of Truth
`TerminalContext` is the central state. All connection state, session list, host list, and logs flow from there. Do not duplicate state across components.

### 4. Proxy: Singleton Services
Each proxy service is a class with a single instance exported:
```js
class FooService { ... }
module.exports = new FooService();
```
Never instantiate services multiple times. Pass them as imports.

### 5. Config via Environment
Proxy config comes from `config/index.js` which reads `process.env`. Never hardcode values like port or shell in service files.

---

## Design System — KINETIC_CONSOLE

The aesthetic is: **dark terminal, phosphor green, monospace, uppercase labels**.

### Color Palette
Always import from `theme/theme.js`. Never use raw hex strings.

```js
import { C, MONO } from '../theme/theme.js';

// C.bg          '#0e0e0e'   — app background
// C.surface     '#131313'   — card/panel background
// C.surfaceHigh '#20201f'   — elevated surface
// C.primary     '#52fd2e'   — THE green, used for active elements, accents
// C.onPrimary   '#0e5b00'   — text on primary green backgrounds
// C.muted       '#adaaaa'   — secondary text, inactive icons
// C.outline     '#484847'   — borders, dividers
// C.error       '#ff7351'   — error states
// C.warn        '#eba300'   — warning states
```

### Typography
```js
import { MONO } from '../theme/theme.js';
// Resolves to 'Menlo' (iOS) or 'monospace' (Android)
```
Use `MONO` for ALL text. No system UI fonts.

### UI Rules
- Labels: `UPPERCASE`, `letterSpacing: 1.5+`
- Active tab: `backgroundColor: C.primary` (green fill), text `C.onPrimary`
- Inactive tab: `C.muted`
- Headers: `color: C.primary`, `bold`, `letterSpacing: 2`, `textTransform: 'uppercase'`
- App header title: always `'KINETIC_CONSOLE'`

**Exception**: `AppNavigator.js` duplicates the `C` object inline. That's a known debt — new code must use `theme/theme.js`.

---

## Naming Conventions

| Type | Pattern | Example |
|---|---|---|
| React component | `PascalCase.js` | `HostCard.js` |
| Screen | `XxxScreen.js` | `HomeScreen.js` |
| Hook | `useXxx.js` | `useHosts.js` |
| Proxy service | `xxx.service.js` | `pty.service.js` |
| Config / Utils | `camelCase.js` | `constants.js`, `url.js` |
| Constants | `SCREAMING_SNAKE_CASE` | `RECONNECT_MAX_ATTEMPTS` |
| Storage keys | `@kinetic/snake_case` | `@kinetic/recent_hosts` |

---

## Module System — CRITICAL

| Location | System | Rule |
|---|---|---|
| `mobile-app/` | ES Modules | `import` / `export` ONLY |
| `proxy-server/` | CommonJS | `require` / `module.exports` ONLY |

**Never mix.** Using `require()` in mobile-app or `import` in proxy-server will break the build.

---

## Component Guidelines

### Pure Components
Components under `components/` MUST be pure:
- Receive ALL data as props
- Receive ALL callbacks as props
- No `useContext`, no `AsyncStorage`, no direct API calls
- No internal business state beyond local UI state (e.g., `isExpanded`)

### Component Props Shape
Document expected props with JSDoc or inline comments. Keep prop drilling shallow — if a component needs 5+ props from context, create a container screen or intermediate hook.

---

## Hook Guidelines

- Hooks encapsulate: async operations, derived state, side effects, persistence
- One concern per hook — don't create god hooks
- Return only what consumers need — no leaking internal refs unless necessary
- Hooks CAN call other hooks
- Always clean up effects (`useEffect` return) and timeouts

---

## Proxy Server Guidelines

### Services
- Each service owns one domain: PTY, tmux, tunnel, security
- Services communicate only through their public methods — no reaching into another service's internal state
- Async operations MUST be `async/await` — no raw `.then()` chains

### Entry Point (`index.js`)
- `index.js` is the composition root: it imports services and wires them to HTTP/WS handlers
- No business logic in `index.js` — route handlers should be thin delegations to services

### Config
- All configurable values go in `config/index.js`
- Services import from `'../config'` — never from `process.env` directly

---

## Connection & Protocol

### URL Resolution
Always use `resolveHost(input)` from `utils/url.js`:
```js
const { httpUrl, wsUrl, token, id } = resolveHost(input);
```
It handles: bare IPs, full URLs, Magic Links (`#token=X&id=Y`), IPv6, tunnel detection, default port (4000).

### Magic Links
Format: `https://host.com/#token=abc123&id=my-session`
Fragment is parsed manually (URLSearchParams not used — React Native compatibility).

### Tunnel Support
Domains `.loca.lt` and `.trycloudflare.com` → force `https/wss` protocol.
ALWAYS include bypass headers when making fetch/WebSocket requests:
```js
import { BYPASS_HEADERS } from '../config/network.js';
// or from utils/url.js (same export)
```

### Authentication
- Token passed via: query param `?token=X` AND header `Authorization: Bearer X`
- Proxy validates token in `security.service.js` before any response

### WebSocket Message Protocol
All messages are JSON `{ type, ...payload }`:

| Type | Direction | Payload |
|---|---|---|
| `input` | client → server | `{ content: string }` |
| `resize` | client → server | `{ cols: number, rows: number }` |
| `tmux-cmd` | client → server | `{ cmd: string }` |
| `get-windows` | client → server | `{}` |
| `tmux-windows` | server → client | `{ data: [...] }` |

Non-JSON messages from the server = raw PTY output, pass directly to xterm.js.

### Reconnect Strategy
- Max 10 attempts, exponential backoff
- Base: 1000ms, Max: 30000ms
- Formula: `min(base * 2^(attempt-1), max)`
- Manual disconnect skips reconnect

---

## Storage (AsyncStorage)

All keys defined in `config/constants.js`. Always import from there — never hardcode strings.

| Constant | Key | Value |
|---|---|---|
| `STORAGE_KEYS.RECENT_HOSTS` | `@kinetic/recent_hosts` | `Host[]` JSON |
| `STORAGE_KEYS.DARK_MODE` | `@kinetic/dark_mode` | boolean |
| `STORAGE_KEYS.LOG_LEVEL` | `@kinetic/log_level` | string |
| `STORAGE_KEYS.SNIPPETS` | `@kinetic/snippets` | `Snippet[]` JSON |

### Host Model
```js
{ name: string, ip: string, token: string, lastUsed: number }
```
- Sorted by `lastUsed` descending
- Max 10 hosts (enforced by `useHosts`)

---

## Navigation Structure

```
BottomTabs
├── Hosts (tab)
│   └── HomeStack (NativeStack)
│       ├── HomeScreen         — session launcher, host list
│       └── ManageHosts        — HostsScreen (add/edit/delete hosts)
├── Terminal (tab)
│   └── TerminalScreen         — xterm.js WebView, no header
├── Snippets (tab)
│   └── SnippetsScreen
└── Settings (tab)
    └── SettingsScreen
```

Navigation params for `ManageHosts`: none required — reads hosts from `TerminalContext`.

---

## What NOT to Do

- **No raw hex colors** — always use `C` from `theme/theme.js`
- **No business logic in components** — components are dumb presentational units
- **No direct `AsyncStorage` in components or screens** — use hooks
- **No `useContext(TerminalContext)` in components** — only screens consume context
- **No CommonJS in `mobile-app/`** — ES modules only
- **No ES modules in `proxy-server/`** — CommonJS only
- **No hardcoded ports, shell names, or config values** — use `config/index.js`
- **No `new PTYService()` inside handlers** — import the singleton
- **No `process.env.X` in services** — import from `config/`
- **No skipping bypass headers** on tunnel connections — Localtunnel will block with an interstitial page
- **No forcing `http/ws`** for tunnel domains — always upgrade to `https/wss`
- **No new screens without adding to `AppNavigator.js`**
- **No god hooks** — one concern per hook
- **Never build after changes** — the user runs the build manually
