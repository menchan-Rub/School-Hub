const WebSocket = require('ws');
const logger = require('./logger');
const config = require('../config');

// WebSocketサーバーの設定
const setupWebSocket = (server) => {
  const wss = new WebSocket.Server({
    server,
    maxPayload: config.websocket.maxPayload,
    path: config.websocket.path
  });

  // 接続イベントの処理
  wss.on('connection', handleConnection);

  // エラーイベントの処理
  wss.on('error', (error) => {
    logger.error('WebSocket server error:', error);
  });

  return wss;
};

// クライアント接続の処理
const handleConnection = (ws, req) => {
  const ip = req.socket.remoteAddress;
  logger.info('New WebSocket connection', { ip });

  // クライアントにウェルカムメッセージを送信
  sendMessage(ws, {
    type: 'WELCOME',
    message: 'Connected to browser WebSocket server'
  });

  // メッセージイベントの処理
  ws.on('message', (data) => handleMessage(ws, data));

  // エラーイベントの処理
  ws.on('error', (error) => {
    logger.error('WebSocket client error:', {
      error: error.message,
      ip
    });
  });

  // 切断イベントの処理
  ws.on('close', () => {
    logger.info('WebSocket connection closed', { ip });
  });

  // Pingの送信
  startPingInterval(ws);
};

// メッセージの処理
const handleMessage = (ws, data) => {
  try {
    const message = JSON.parse(data);

    switch (message.type) {
      case 'NAVIGATE':
        handleNavigation(ws, message);
        break;

      case 'DOWNLOAD_PROGRESS':
        handleDownloadProgress(ws, message);
        break;

      case 'PIP_STATE':
        handlePipState(ws, message);
        break;

      case 'PONG':
        handlePong(ws);
        break;

      default:
        logger.warn('Unknown message type:', message.type);
    }
  } catch (error) {
    logger.error('Error processing WebSocket message:', error);
  }
};

// ナビゲーションの処理
const handleNavigation = (ws, message) => {
  broadcastMessage({
    type: 'NAVIGATE',
    url: message.url
  }, ws);
};

// ダウンロード進捗の処理
const handleDownloadProgress = (ws, message) => {
  broadcastMessage({
    type: 'DOWNLOAD_PROGRESS',
    id: message.id,
    progress: message.progress
  });
};

// PiP状態の処理
const handlePipState = (ws, message) => {
  broadcastMessage({
    type: 'PIP_STATE_CHANGED',
    state: message.state
  });
};

// Pongの処理
const handlePong = (ws) => {
  ws.isAlive = true;
};

// メッセージの送信
const sendMessage = (ws, message) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
};

// メッセージのブロードキャスト
const broadcastMessage = (message, exclude = null) => {
  global.wss.clients.forEach(client => {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};

// Pingインターバルの開始
const startPingInterval = (ws) => {
  ws.isAlive = true;
  const interval = setInterval(() => {
    if (ws.isAlive === false) {
      clearInterval(interval);
      return ws.terminate();
    }

    ws.isAlive = false;
    sendMessage(ws, { type: 'PING' });
  }, config.websocket.pingInterval || 30000);

  ws.on('close', () => {
    clearInterval(interval);
  });
};

// 接続数の取得
const getConnectionCount = () => {
  return global.wss?.clients.size || 0;
};

// アクティブな接続のチェック
const checkConnections = () => {
  const connections = [];
  global.wss?.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      connections.push({
        ip: client._socket.remoteAddress,
        protocol: client.protocol,
        isAlive: client.isAlive
      });
    }
  });
  return connections;
};

module.exports = {
  setupWebSocket,
  sendMessage,
  broadcastMessage,
  getConnectionCount,
  checkConnections
}; 