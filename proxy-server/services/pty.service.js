const pty = require('node-pty');
const config = require('../config');

class PTYService {
  constructor() {
    this.activeSessions = new Map(); // sessionName -> { ws, ptyProcess }
  }

  create(sessionName, options = {}) {
    const shellArgs = config.PROXY_SHELL === 'tmux' ? ['new-session', '-A', '-s', sessionName] : [];
    
    const ptyProcess = pty.spawn(config.PROXY_SHELL, shellArgs, {
      name: 'xterm-color',
      cols: options.cols || 80,
      rows: options.rows || 24,
      cwd: config.HOME,
      env: config.ENV_VARS
    });

    return ptyProcess;
  }

  register(sessionName, ws, ptyProcess) {
    // Cleanup previous if exists
    this.cleanup(sessionName);
    this.activeSessions.set(sessionName, { ws, ptyProcess });
  }

  cleanup(sessionName) {
    if (this.activeSessions.has(sessionName)) {
      const { ws, ptyProcess } = this.activeSessions.get(sessionName);
      try { ptyProcess.kill(); } catch (_) {}
      // We don't close WS here as it might be a reconnection attempt
      this.activeSessions.delete(sessionName);
    }
  }

  get(sessionName) {
    return this.activeSessions.get(sessionName);
  }
}

module.exports = new PTYService();
