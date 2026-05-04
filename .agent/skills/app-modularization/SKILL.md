# SKILL: App Architecture Standards

## Overview
This application follows a "Logic-in-Hooks" pattern. Screens and Contexts should be thin and focus on orchestration.

## Rules
1. **Domain Isolation**: Domain logic (Storage, WebSocket, Camera) MUST be extracted into custom hooks under `hooks/`.
2. **Context Purity**: `TerminalContext` SHALL NOT implement storage or connection logic; it MUST delegate to domain hooks.
3. **Presentational Components**: Components in `components/ui/` MUST NOT import global context or hooks. They receive data only via props.
4. **Network Consistency**: All requests MUST use `BYPASS_HEADERS` and include the security token from `useTerminal`.

## Folder Structure
- `components/ui/`: Atomic, reusable UI elements.
- `components/host/`: Host-specific UI and logic.
- `hooks/`: Domain-specific logic.
- `config/`: Centralized constants and theme.
