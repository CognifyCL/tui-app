const crypto = require('crypto');
const configService = require('./config.service');

class SecurityService {
  constructor() {
    this.pairingToken = configService.get('TOKEN');
    
    if (!this.pairingToken) {
      this.pairingToken = crypto.randomBytes(16).toString('hex');
      configService.set('TOKEN', this.pairingToken);
    }
  }

  getToken() {
    return this.pairingToken;
  }

  validateToken(token) {
    return token === this.pairingToken;
  }

  generateNewToken() {
    this.pairingToken = crypto.randomBytes(16).toString('hex');
    configService.set('TOKEN', this.pairingToken);
    return this.pairingToken;
  }
}

module.exports = new SecurityService();
