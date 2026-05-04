# Kinetic Console 📱💻

**The professional, minimalist terminal client for AI Engineers and Sysadmins.**

Interact with your remote TUI tools (OpenCode, Claude in tmux, Neovim) through a high-performance terminal rendered on your mobile device. Built with **React Native (Expo)**, **xterm.js**, and **Material Design 3**.

---

## ✨ Features

- 🚀 **Material Design 3 (Google Style)**: Clean, professional, and intuitive UI.
- 🍔 **Drawer Navigation**: Easy access to Dashboard, Terminal, Hosts, and Snippets.
- 🧠 **Persistent Terminal**: WebSocket connection stays alive while you navigate through the app.
- 📑 **Tmux Window Switcher**: Seamlessly switch between tmux windows with native mobile tabs.
- ⚡ **Pane Manager**: Split panes (V/H), zoom, and kill panes with floating action buttons.
- ✂️ **Snippet Manager**: Execute saved commands into the terminal with a single tap.
- 🥇 **Smart Host Resolver**: Supports IPs, MagicDNS (Tailscale), and full URLs with auto-sorting.
- 📜 **Live Logs**: Real-time diagnostic viewer for WebSocket and networking.

---

## 🏗️ Architecture

- **Mobile App (Frontend)**: React Native (Expo) + WebView (xterm.js with WebGL).
- **Proxy Server (Backend)**: Node.js + `node-pty` + WebSockets + HTTP.
- **Session Management**: Native `tmux` integration for persistent workflows.

---

## 🚀 Getting Started

### 1. Proxy Server (The Host)
The proxy server needs to run on the machine where your tmux sessions are.

**Option A: Install via NPM (Recommended)**
```bash
cd proxy-server
npm install
npm link
kinetic-console install
```

**Option B: Docker**
```bash
docker compose up -d
```

### 2. Mobile App (The Client)
1. Install dependencies: `cd mobile-app && npm install`
2. Start Expo: `npx expo start`
3. Scan the QR code with **Expo Go** (Android/iOS).

---

## 🛡️ Networking & Security (Tailscale)

For secure, port-forwarding-free access, use **Tailscale**.
1. Install Tailscale on your server and phone.
2. The server will be assigned a MagicDNS name (e.g., `openclaw`).
3. Enter `openclaw` in the App's **Host Address** and connect!

---

## 📦 Publishing to App Stores

This project is built with Expo, making publication straightforward using **EAS (Expo Application Services)**.

### Prerequisites
1. Create an [Expo Account](https://expo.dev).
2. Install EAS CLI: `npm install -g eas-cli`.
3. Login: `eas login`.

### Android (Play Store)
1. Configure project: `cd mobile-app && eas build:configure`.
2. Build AAB: `eas build --platform android`.
3. Submit to Play Store: `eas submit --platform android`.

### iOS (App Store)
1. Apple Developer Program membership required.
2. Configure project: `cd mobile-app && eas build:configure`.
3. Build IPA: `eas build --platform ios`.
4. Submit to TestFlight/App Store: `eas submit --platform ios`.

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or pull requests to improve the ultimate mobile TUI experience.
