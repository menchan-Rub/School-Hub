const express = require('express');
const http = require('http');
const cors = require('cors');
const WebSocketServer = require('./websocket');
const { browser } = require('./utils/cef');
const api = require('./api');
const logger = require('./utils/logger');
const config = require('./config');
const db = require('./db');
const middleware = require('./middleware');

const app = express();
const server = http.createServer(app);

// ミドルウェアの設定
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// APIルートの設定
app.use('/api', api);

// WebSocketサーバーの初期化
const wss = new WebSocketServer(server);

// ミドルウェアの設定
app.use(middleware.logging);
app.use(middleware.securityHeaders);
app.use(express.json({ limit: middleware.bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: middleware.bodyLimit }));

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// WebSocket接続の処理
wss.on('connection', (ws) => {
  logger.info('New WebSocket connection');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'NAVIGATE':
          // ブラウザのナビゲーション要求を処理
          wss.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'NAVIGATE',
                url: data.url
              }));
            }
          });
          break;

        case 'DOWNLOAD_PROGRESS':
          // ダウンロードの進捗を処理
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'DOWNLOAD_PROGRESS',
                id: data.id,
                progress: data.progress
              }));
            }
          });
          break;

        default:
          logger.warn('Unknown WebSocket message type:', data.type);
      }
    } catch (error) {
      logger.error('Error processing WebSocket message:', error);
    }
  });

  ws.on('error', (error) => {
    logger.error('WebSocket error:', error);
  });

  ws.on('close', () => {
    logger.info('WebSocket connection closed');
  });
});

// エラーハンドリング
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// サーバーの起動
async function start() {
  try {
    // CEFブラウザの起動
    await browser.start();
    logger.info('CEF browser started successfully');

    // データベースの初期化
    await db.initialize();

    // HTTPサーバーの起動
    server.listen(config.port, () => {
      logger.info(`Server is running on port ${config.port}`);
    });

    // シャットダウンハンドラの設定
    process.on('SIGINT', async () => {
      logger.info('Shutting down...');
      await browser.stop();
      await db.pool.end();
      logger.info('Database connections closed');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

start(); 