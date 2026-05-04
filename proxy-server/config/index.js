const os = require('os');
const configService = require('../services/config.service');

const config = configService.getAll();

module.exports = {
  ENV_VARS: process.env,
  PORT: process.env.PORT || config.PORT || 4000,
  PROXY_SHELL: process.env.PROXY_SHELL || config.PROXY_SHELL || 'tmux',
  LOG_LEVEL: process.env.LOG_LEVEL || config.LOG_LEVEL || 'info',
  TOKEN: process.env.TOKEN || config.TOKEN || null,
  SYNC_INTERVAL_MS: parseInt(process.env.SYNC_INTERVAL_MS) || 10000,
  HOME: process.env.HOME || os.homedir(),
};
