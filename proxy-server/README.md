# @cognifycl/tui-app-proxy 🚀📱

**The high-performance WebSocket/HTTP proxy for the TUI Mobile Client.**

This proxy enables remote terminal access to your server via the **TUI Mobile** app. It integrates natively with `tmux` to provide persistent, multi-window terminal sessions on your mobile device.

---

## 🛠️ Installation

**Global Install (Recommended)**
```bash
npm install -g @cognifycl/tui-app-proxy
```

## 🚀 Usage

Start the proxy server on your host machine:

```bash
# Default port 3000
tui-app-proxy

# Custom port
PORT=4000 tui-app-proxy

# Custom default shell (e.g., bash instead of tmux)
PROXY_SHELL=bash tui-app-proxy
```

## ✨ Features

- 🔄 **Multiplexed Server**: Handles both HTTP (session discovery) and WebSockets (terminal PTY) on a single port.
- 🪟 **Tmux Native**: Full support for listing windows and managing panes via the mobile app.
- ⚡ **node-pty Power**: Low-latency terminal emulation.
- 🛡️ **Sanitized Commands**: Protected against shell injection.

## 📱 Client App

To use this proxy, download or build the **TUI Mobile** app from the main repository:
[GitHub - TUI Mobile Client](https://github.com/cognifycl/tui-app)

## 📜 License

MIT
