const { exec } = require('child_process');

class TmuxService {
  async listSessions() {
    return new Promise((resolve) => {
      exec("tmux ls -F '#S\t#{session_created}\t#{session_attached}'", (error, stdout) => {
        if (error || !stdout || !stdout.trim()) {
          return resolve([]);
        }

        const lines = stdout.trim().split('\n').filter(l => l.trim().length > 0);
        const now = Math.floor(Date.now() / 1000);

        const sessions = lines.map(line => {
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
          return { name, created, attached };
        });

        resolve(sessions);
      });
    });
  }

  async listWindows(sessionName) {
    return new Promise((resolve) => {
      const cmd = `tmux list-windows -t ${sessionName} -F '#I:#W:#{window_active}'`;
      exec(cmd, (error, stdout) => {
        if (error) return resolve([]);
        const windows = stdout.trim().split('\n')
          .filter(line => line.length > 0)
          .map(line => {
            const [id, name, active] = line.split(':');
            return { id, name, active: active === '1' };
          });
        resolve(windows);
      });
    });
  }

  async executeCommand(sessionName, rawCmd) {
    // Sanitization logic should be here or in a dedicated validator
    const cmd = `tmux ${rawCmd} -t ${sessionName}`;
    return new Promise((resolve, reject) => {
      exec(cmd, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = new TmuxService();
