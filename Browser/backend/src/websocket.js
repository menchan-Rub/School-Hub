const WebSocket = require('ws');
const logger = require('./utils/logger');
const { browser } = require('./utils/cef');

class WebSocketServer extends WebSocket.Server {
  constructor(server) {
    super({ server });
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.on('connection', (ws) => {
      logger.info('New WebSocket connection established');

      // 接続確認メッセージを送信
      ws.send(JSON.stringify({ type: 'CONNECTED' }));

      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          logger.info('Received message:', data);

          switch (data.type) {
            case 'NEW_TAB':
              try {
                const tab = await browser.handleNewTab(data.url);
                ws.send(JSON.stringify({
                  type: 'TAB_CREATED',
                  tabId: tab.id,
                  url: tab.url
                }));
              } catch (error) {
                logger.error('Failed to create new tab:', error);
                ws.send(JSON.stringify({
                  type: 'ERROR',
                  message: 'Failed to create new tab'
                }));
              }
              break;

            case 'NAVIGATE':
              try {
                await browser.handleNavigate(data.url);
                ws.send(JSON.stringify({
                  type: 'NAVIGATED',
                  url: data.url
                }));
              } catch (error) {
                logger.error('Failed to navigate:', error);
                ws.send(JSON.stringify({
                  type: 'ERROR',
                  message: 'Failed to navigate'
                }));
              }
              break;

            default:
              logger.warn('Unknown message type:', data.type);
          }
        } catch (error) {
          logger.error('Failed to process message:', error);
          ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Internal server error'
          }));
        }
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
      });

      ws.on('close', () => {
        logger.info('WebSocket connection closed');
      });
    });
  }
}

module.exports = WebSocketServer; 