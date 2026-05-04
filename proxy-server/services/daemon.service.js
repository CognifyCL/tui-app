const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

class DaemonService {
  constructor() {
    this.serviceName = 'kinetic-console.service';
    this.servicePath = `/etc/systemd/system/${this.serviceName}`;
    this.configDir = path.join(os.homedir(), '.config', 'kinetic-console');
  }

  install() {
    try {
      const nodePath = process.execPath;
      const scriptPath = path.resolve(__dirname, '..', 'index.js');
      const user = os.userInfo().username;
      const group = os.userInfo().gid;

      const unitFile = `[Unit]
Description=Kinetic Console Proxy Server
After=network.target

[Service]
Type=simple
User=${user}
WorkingDirectory=${path.resolve(__dirname, '..')}
ExecStart=${nodePath} ${scriptPath} start
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
`;

      console.log(`Generating systemd unit file at ${this.servicePath}...`);
      
      // Use a temporary file and sudo mv because we might not have direct write access
      const tmpPath = path.join(os.tmpdir(), this.serviceName);
      fs.writeFileSync(tmpPath, unitFile);

      console.log('Applying systemd configuration (requires sudo)...');
      execSync(`sudo mv ${tmpPath} ${this.servicePath}`);
      execSync('sudo systemctl daemon-reload');
      execSync(`sudo systemctl enable ${this.serviceName}`);
      execSync(`sudo systemctl start ${this.serviceName}`);

      return true;
    } catch (err) {
      console.error('Failed to install daemon:', err.message);
      return false;
    }
  }

  uninstall() {
    try {
      console.log(`Stopping and disabling ${this.serviceName}...`);
      execSync(`sudo systemctl stop ${this.serviceName} || true`);
      execSync(`sudo systemctl disable ${this.serviceName} || true`);
      
      if (fs.existsSync(this.servicePath)) {
        console.log(`Removing ${this.servicePath}...`);
        execSync(`sudo rm ${this.servicePath}`);
      }

      execSync('sudo systemctl daemon-reload');
      return true;
    } catch (err) {
      console.error('Failed to uninstall daemon:', err.message);
      return false;
    }
  }

  status() {
    try {
      const output = execSync(`systemctl is-active ${this.serviceName}`, { encoding: 'utf8' }).trim();
      return output === 'active';
    } catch (err) {
      return false;
    }
  }

  logs() {
    try {
      const { execSync } = require('child_process');
      execSync(`sudo journalctl -u ${this.serviceName} -f -n 50`, { stdio: 'inherit' });
    } catch (e) {}
  }
}

module.exports = new DaemonService();
