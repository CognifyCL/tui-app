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

    exec("tmux ls -F '#S\t#{session_created}\t#{session_attached}'", (error, stdout) => {
      if (error || !stdout || !stdout.trim()) {
        res.writeHead(200);
        res.end(JSON.stringify([]));
        return;
      }

      const lines = stdout.trim().split('\n').filter(l => l.trim().length > 0);
      const now = Math.floor(Date.now() / 1000);

      const metaPromises = lines.map(line => {
        const [name, createdStr, attachedStr] = line.split('\t');
        const attached = parseInt(attachedStr, 10) > 0;
        const createdTs = parseInt(createdStr, 10);
        const ageSecs = now - createdTs;
        let created = '';
        if (!isNaN(ageSecs) && ageSecs >= 0) {
          if (ageSecs < 3600) created = `${Math.floor(ageSecs / 60)}m ago`;
          else if (ageSecs < 86400) created = `${Math.floor(ageSecs / 3600)}h ago`;
          else created = `${Math.floor(ageSecs / 86400)}d ago`;
        }

        return new Promise(resolve => {
          exec(`tmux list-windows -t ${name} | wc -l`, (err, out) => {
            const windows = err ? 1 : (parseInt(out.trim(), 10) || 1);
            resolve({ name, windows, created, attached });
          });
        });
      });

      Promise.all(metaPromises).then(sessions => {
        res.writeHead(200);
        res.end(JSON.stringify(sessions));
      });
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
      } else if (data.type === 'get-windows') {
        broadcastWindows();
      } else if (data.type === 'tmux-cmd') {
        // Structured tmux command (Phase 1.1)
        const allowedCommands = ['select-window', 'split-window', 'resize-pane', 'zoom-pane', 'kill-pane', 'new-window'];
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
