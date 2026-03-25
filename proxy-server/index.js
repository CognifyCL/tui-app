#!/usr/bin/env node

const http = require('http');
const WebSocket = require('ws');
const os = require('os');
const pty = require('node-pty');
const url = require('url');
const { exec } = require('child_process');

const PORT = process.env.PORT || 4000;
const PROXY_SHELL = process.env.PROXY_SHELL || 'tmux';

// Create HTTP server for both REST and WebSocket
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  if (parsedUrl.pathname === '/sessions') {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Run tmux ls to get session names
    exec("tmux ls -F '#S'", (error, stdout, stderr) => {
      let sessions = [];
      if (!error && stdout) {
        sessions = stdout.trim().split('\n').filter(s => s.trim().length > 0);
      }
      
      res.writeHead(200);
      res.end(JSON.stringify(sessions));
    });
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const wss = new WebSocket.Server({ server });

console.log(`--- TUI Proxy Server started on port ${PORT} ---`);
console.log(`--- Using shell: ${PROXY_SHELL} ---`);

wss.on('connection', (ws, req) => {
  // Extraemos el nombre de la sesión de la URL (ej: ws://host:4000?session=mi-sesion)
  const parameters = url.parse(req.url, true).query;
  const sessionName = parameters.session || 'default';
  
  console.log(`Client connected! Attaching to session: ${sessionName}`);

  // Iniciamos el PTY vinculado a la sesión de shell específica
  const shellArgs = PROXY_SHELL === 'tmux' ? ['new-session', '-A', '-s', sessionName] : [];
  
  const ptyProcess = pty.spawn(PROXY_SHELL, shellArgs, {
    name: 'xterm-color',
    cols: 80,
    rows: 24,
    cwd: process.env.HOME,
    env: process.env
  });

  // --- Tmux Poweruser Helpers ---
  const getWindows = (callback) => {
    const cmd = `tmux list-windows -t ${sessionName} -F '#I:#W:#{window_active}'`;
    exec(cmd, (error, stdout) => {
      if (error) return callback([]);
      const windows = stdout.trim().split('\n')
        .filter(line => line.length > 0)
        .map(line => {
          const [id, name, active] = line.split(':');
          return { id, name, active: active === '1' };
        });
      callback(windows);
    });
  };

  const broadcastWindows = () => {
    getWindows((windows) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'tmux-windows', data: windows }));
      }
    });
  };

  const syncInterval = setInterval(broadcastWindows, 10000);
  broadcastWindows(); // Initial sync
  // ------------------------------

  // Enviamos la salida de la terminal al WebSocket
  ptyProcess.onData((data) => {
    ws.send(data);
  });

  // Manejamos los mensajes que vienen del cliente (Móvil)
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'input') {
        // Entrada de teclado / comandos
        ptyProcess.write(data.content);
      } else if (data.type === 'resize') {
        // Redimensionamiento de la terminal (SIGWINCH)
        ptyProcess.resize(data.cols, data.rows);
      } else if (data.type === 'tmux-cmd') {
        // Structured tmux command (Phase 1.1)
        const allowedCommands = ['select-window', 'split-window', 'resize-pane', 'zoom-pane', 'kill-pane'];
        const cmdParts = data.cmd.split(' ');
        const subCommand = cmdParts[0];

        // Basic Whitelist & Sanitization (Phase 1.2)
        if (!allowedCommands.includes(subCommand)) {
          console.warn(`Blocked unauthorized tmux command: ${subCommand}`);
          return;
        }

        // Sanitize: No shells metacharacters
        if (/[;&|]/.test(data.cmd)) {
          console.warn(`Blocked potentially malicious tmux command: ${data.cmd}`);
          return;
        }

        const fullCmd = `tmux ${data.cmd}`;
        exec(fullCmd, (err) => {
          if (!err) {
            broadcastWindows(); // Immediate sync (Phase 1.5)
          } else {
            console.error(`Error executing tmux command "${fullCmd}":`, err.message);
          }
        });
      }
    } catch (e) {
      console.error('Error parsing message:', e.message);
    }
  });

  // Limpieza al desconectar
  ws.on('close', () => {
    console.log(`Client disconnected from session ${sessionName}, cleaning up pty...`);
    clearInterval(syncInterval);
    ptyProcess.kill();
  });
});

server.listen(PORT, () => {
  console.log(`HTTP/WS Server listening on port ${PORT}`);
});
