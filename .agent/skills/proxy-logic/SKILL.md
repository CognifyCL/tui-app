# SKILL: Proxy Implementation Standards

## Overview
This project uses a service-oriented architecture for the proxy server. No business logic should reside in the entry point (`index.js`).

## Rules
1. **Service Extraction**: All external interactions (tmux, localtunnel, pty) MUST be encapsulated in a class-based service under `services/`.
2. **Boilerplate Minimization**: `index.js` SHALL ONLY coordinate services and handle HTTP/WS lifecycle.
3. **Command Sanitization**: Any command sent to `TmuxService` MUST be validated against a whitelist of allowed subcommands.
4. **Security Enforcement**: All endpoints and WebSocket connections MUST validate the pairing token via `SecurityService`.

## Pattern
- Service: `services/example.service.js`
- Usage: `const example = require('./services/example.service');`
