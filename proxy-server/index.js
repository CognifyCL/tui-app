#!/usr/bin/env node

const http = require('http');
const WebSocket = require('ws');
const url = require('url');

const config = require('./config');
const tmux = require('./services/tmux.service');
const tunnel = require('./services/tunnel.service');
const security = require('./services/security.service');
const pty = require('./services/pty.service');
const daemon = require('./services/daemon.service');

let currentMagicLink = null;
let currentDeepLink = null;

// Create HTTP server for sessions API
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (parsedUrl.pathname === '/sessions') {
    res.setHeader('Content-Type', 'application/json');
    if (!security.validateToken(parsedUrl.query.token)) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    const sessions = await tmux.listSessions();
    res.writeHead(200);
    res.end(JSON.stringify(sessions));
  } else if (parsedUrl.pathname === '/') {
    res.setHeader('Content-Type', 'text/html');
    if (!currentMagicLink) {
      res.writeHead(200);
      res.end('<h1>Initializing...</h1><p>Please wait while the tunnel starts.</p>');
      return;
    }
    const html = tunnel.getPairingHTML(currentMagicLink, currentDeepLink);
    res.writeHead(200);
    res.end(html);
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(404);
    res.end('Not Found');
  }
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  const parameters = url.parse(req.url, true).query;
  const sessionName = parameters.session || 'default';
  const token = parameters.token;

  if (!security.validateToken(token)) {
    console.warn(`Unauthorized connection attempt to session: ${sessionName}`);
    ws.close(1008, 'Unauthorized');
    return;
  }
  
  console.log(`Client connected to session: ${sessionName}`);

  const ptyProcess = pty.create(sessionName);
  pty.register(sessionName, ws, ptyProcess);

  // Tmux Sync Helpers
  const broadcastWindows = async () => {
    const windows = await tmux.listWindows(sessionName);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'tmux-windows', data: windows }));
    }
  };

  const syncInterval = setInterval(broadcastWindows, config.SYNC_INTERVAL_MS);
  broadcastWindows();

  ptyProcess.onData(data => ws.send(data));

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'input') ptyProcess.write(data.content);
      else if (data.type === 'resize') ptyProcess.resize(data.cols, data.rows);
      else if (data.type === 'get-windows') await broadcastWindows();
      else if (data.type === 'tmux-cmd') {
        await tmux.executeCommand(sessionName, data.cmd);
        await broadcastWindows();
      }
    } catch (e) {
      console.error('Error handling message:', e.message);
    }
  });

  ws.on('close', () => {
    console.log(`Cleaning up session: ${sessionName}`);
    clearInterval(syncInterval);
    pty.cleanup(sessionName);
  });
});

const configService = require('./services/config.service');

async function startServer() {
  server.listen(config.PORT, async () => {
    console.clear();
    console.log(`\x1b[1;32m--- KINETIC CONSOLE PROXY SERVER ---\x1b[0m`);
    console.log(`Local port: ${config.PORT}`);
    console.log(`Token: \x1b[33m${security.getToken()}\x1b[0m`);

    const tunnelUrl = await tunnel.start(config.PORT);
    if (tunnelUrl) {
      configService.set('TUNNEL_URL', tunnelUrl);
      currentMagicLink = tunnel.generateMagicLink(tunnelUrl, security.getToken());
      currentDeepLink = tunnel.generateDeepLink(tunnelUrl, security.getToken());

      tunnel.showQRCode(currentMagicLink);
      console.log(`\n\x1b[1mPairing Page:\x1b[0m \x1b[4;34m${tunnelUrl}\x1b[0m`);
    }
  });
}

const command = process.argv[2] || 'start';

// Command Router
switch (command) {
  case 'install':
    console.log('Installing kinetic-console as a system daemon...');
    if (daemon.install()) {
      console.log('Successfully installed! You can check status with: systemctl status kinetic-console');
    }
    break;

  case 'uninstall':
    console.log('Uninstalling kinetic-console daemon...');
    if (daemon.uninstall()) {
      console.log('Successfully uninstalled.');
    }
    break;

  case 'status':
    const active = daemon.status();
    console.log(`Daemon Status: ${active ? '\x1b[32mACTIVE\x1b[0m' : '\x1b[31mINACTIVE\x1b[0m'}`);
    break;

  case 'connect':
    const savedUrl = configService.get('TUNNEL_URL');
    const savedToken = security.getToken();

    if (!savedUrl) {
      console.log('\x1b[31mError: No active tunnel found.\x1b[0m');
      console.log('Make sure the daemon is running with: kinetic-console status');
      console.log('Or start it manually to generate a new tunnel.');
      break;
    }

    const magic = tunnel.generateMagicLink(savedUrl, savedToken);
    const deep = tunnel.generateDeepLink(savedUrl, savedToken);

    console.clear();
    console.log(`\x1b[1;32m--- KINETIC CONSOLE // CONNECTION INFO ---\x1b[0m`);
    tunnel.showQRCode(magic);
    console.log(`\n\x1b[1mPairing Page:\x1b[0m \x1b[4;34m${savedUrl}\x1b[0m`);
    console.log(`\x1b[1mDeep Link:\x1b[0m \x1b[4;36m${deep}\x1b[0m`);
    break;

  case 'logs':
    console.log('Showing daemon logs (journalctl)...');
    daemon.logs();
    break;

  case 'start':
  default:
    startServer();
    break;
}

