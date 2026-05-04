const localtunnel = require('localtunnel');
const qrcode = require('qrcode-terminal');
const os = require('os');

class TunnelService {
  constructor() {
    this.tunnel = null;
  }

  async start(port) {
    try {
      this.tunnel = await localtunnel({ port });
      return this.tunnel.url;
    } catch (err) {
      console.error('Error starting tunnel:', err.message);
      return null;
    }
  }

  generateMagicLink(url, token) {
    return `${url}/#token=${token}&id=${os.hostname()}`;
  }

  generateDeepLink(url, token) {
    // Protocol scheme: kinetic://host?token=...&id=...
    const cleanUrl = url.replace(/^https?:\/\//, '');
    return `kinetic://${cleanUrl}#token=${token}&id=${os.hostname()}`;
  }

  getPairingHTML(magicLink, deepLink) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KINETIC_TUI // PAIRING</title>
    <style>
        body {
            background-color: #0e0e0e;
            color: #52fd2e;
            font-family: 'JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', monospace;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
            padding: 20px;
        }
        .container {
            border: 1px solid #484847;
            padding: 40px;
            background-color: #131313;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 0 20px rgba(82, 253, 46, 0.1);
        }
        h1 {
            letter-spacing: 4px;
            font-size: 1.5rem;
            margin-bottom: 30px;
            border-bottom: 1px solid #484847;
            padding-bottom: 10px;
        }
        .link-box {
            background-color: #20201f;
            padding: 15px;
            border: 1px dashed #52fd2e;
            margin: 20px 0;
            word-break: break-all;
            font-size: 0.8rem;
            color: #e0e0e0;
        }
        .btn {
            background-color: #52fd2e;
            color: #0e5b00;
            border: none;
            padding: 15px 30px;
            font-family: inherit;
            font-weight: bold;
            font-size: 1rem;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin-top: 20px;
            letter-spacing: 2px;
            transition: transform 0.1s;
        }
        .btn:active {
            transform: scale(0.98);
        }
        .footer {
            margin-top: 40px;
            color: #adaaaa;
            font-size: 0.7rem;
            letter-spacing: 1px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>PAIRING_REQUIRED</h1>
        <p>SCAN FAILED? USE THE BUTTON BELOW TO CONNECT THIS DEVICE AUTOMATICALLY.</p>
        
        <a href="${deepLink}" class="btn">CONNECT_NOW</a>

        <div class="footer">
            <p>OR MANUALLY PASTE THIS MAGIC LINK IN THE APP:</p>
            <div class="link-box">${magicLink}</div>
        </div>
    </div>
</body>
</html>
    `;
  }

  showQRCode(magicLink) {
    console.log(`\n\x1b[1;32mPairing QR Code:\x1b[0m`);
    qrcode.generate(magicLink, { small: true });
    console.log(`\n\x1b[1mMagic Link:\x1b[0m \x1b[4;36m${magicLink}\x1b[0m`);
  }

  onClose(callback) {
    if (this.tunnel) {
      this.tunnel.on('close', callback);
    }
  }
}

module.exports = new TunnelService();
