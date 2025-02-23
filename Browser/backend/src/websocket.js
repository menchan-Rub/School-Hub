const WebSocket = require('ws');
const { handleNavigate, handleNewTab, handleCloseTab } = require('./utils/cef');

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Set();
    this.setupWebSocket();
  }

  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      this.clients.add(ws);

      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          await this.handleMessage(ws, data);
        } catch (error) {
          console.error('WebSocket message handling error:', error);
          ws.send(JSON.stringify({
            type: 'ERROR',
            error: error.message
          }));
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
  }

  async handleMessage(ws, data) {
    switch (data.type) {
      case 'NAVIGATE':
        await handleNavigate(data.url);
        this.broadcast({
          type: 'URL_CHANGED',
          url: data.url
        });
        break;

      case 'NEW_TAB':
        const tabId = await handleNewTab(data.url);
        ws.send(JSON.stringify({
          type: 'TAB_CREATED',
          tabId
        }));
        break;

      case 'CLOSE_TAB':
        await handleCloseTab(data.tabId);
        this.broadcast({
          type: 'TAB_CLOSED',
          tabId: data.tabId
        });
        break;

      case 'UPDATE_TITLE':
        this.broadcast({
          type: 'TITLE_CHANGED',
          tabId: data.tabId,
          title: data.title
        });
        break;

      case 'UPDATE_FAVICON':
        this.broadcast({
          type: 'FAVICON_CHANGED',
          tabId: data.tabId,
          favicon: data.favicon
        });
        break;

      default:
        console.warn('Unknown message type:', data.type);
    }
  }

  broadcast(message) {
    const messageStr = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }
}

module.exports = WebSocketServer; 