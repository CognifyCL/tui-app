const fs = require('fs');
const path = require('path');
const os = require('os');

class ConfigService {
  constructor() {
    this.configDir = path.join(os.homedir(), '.config', 'kinetic-console');
    this.configPath = path.join(this.configDir, 'config.json');
    this.defaultConfig = {
      PORT: 4000,
      PROXY_SHELL: 'tmux',
      LOG_LEVEL: 'info',
      TOKEN: null,
      TUNNEL_URL: null
    };
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      if (!fs.existsSync(this.configDir)) {
        fs.mkdirSync(this.configDir, { recursive: true });
      }

      if (!fs.existsSync(this.configPath)) {
        fs.writeFileSync(this.configPath, JSON.stringify(this.defaultConfig, null, 2));
        return this.defaultConfig;
      }

      const data = fs.readFileSync(this.configPath, 'utf8');
      return { ...this.defaultConfig, ...JSON.parse(data) };
    } catch (err) {
      console.error('Error loading config:', err.message);
      return this.defaultConfig;
    }
  }

  get(key) {
    return this.config[key];
  }

  set(key, value) {
    this.config[key] = value;
    this.save();
  }

  save() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (err) {
      console.error('Error saving config:', err.message);
    }
  }

  getAll() {
    return this.config;
  }
}

module.exports = new ConfigService();
