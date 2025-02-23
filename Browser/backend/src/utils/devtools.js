const logger = require('./logger');
const WebSocket = require('ws');

// デバッグセッションの管理
let debugSessions = new Map();

// デバッグセッションの開始
const startDebugSession = async (targetId, options = {}) => {
  try {
    const session = {
      id: targetId,
      startTime: Date.now(),
      breakpoints: new Set(),
      watches: new Set(),
      consoleHistory: [],
      networkLogs: [],
      ...options
    };

    debugSessions.set(targetId, session);
    logger.info('Debug session started', { targetId, options });

    return session;
  } catch (error) {
    logger.error('Failed to start debug session:', error);
    throw error;
  }
};

// デバッグセッションの終了
const stopDebugSession = async (targetId) => {
  try {
    if (!debugSessions.has(targetId)) {
      throw new Error('Debug session not found');
    }

    debugSessions.delete(targetId);
    logger.info('Debug session stopped', { targetId });
    return true;
  } catch (error) {
    logger.error('Failed to stop debug session:', error);
    throw error;
  }
};

// ブレークポイントの設定
const setBreakpoint = async (targetId, location) => {
  try {
    const session = debugSessions.get(targetId);
    if (!session) {
      throw new Error('Debug session not found');
    }

    session.breakpoints.add(location);
    logger.debug('Breakpoint set', { targetId, location });
    return Array.from(session.breakpoints);
  } catch (error) {
    logger.error('Failed to set breakpoint:', error);
    throw error;
  }
};

// ウォッチ式の追加
const addWatch = async (targetId, expression) => {
  try {
    const session = debugSessions.get(targetId);
    if (!session) {
      throw new Error('Debug session not found');
    }

    session.watches.add(expression);
    logger.debug('Watch expression added', { targetId, expression });
    return Array.from(session.watches);
  } catch (error) {
    logger.error('Failed to add watch expression:', error);
    throw error;
  }
};

// コンソールログの記録
const logConsole = async (targetId, message) => {
  try {
    const session = debugSessions.get(targetId);
    if (!session) {
      throw new Error('Debug session not found');
    }

    const logEntry = {
      timestamp: Date.now(),
      type: message.type || 'log',
      content: message.content,
      stack: message.stack
    };

    session.consoleHistory.push(logEntry);
    logger.debug('Console log recorded', { targetId, logEntry });
    return logEntry;
  } catch (error) {
    logger.error('Failed to record console log:', error);
    throw error;
  }
};

// ネットワークリクエストの記録
const logNetwork = async (targetId, request) => {
  try {
    const session = debugSessions.get(targetId);
    if (!session) {
      throw new Error('Debug session not found');
    }

    const networkEntry = {
      timestamp: Date.now(),
      method: request.method,
      url: request.url,
      headers: request.headers,
      body: request.body,
      response: request.response
    };

    session.networkLogs.push(networkEntry);
    logger.debug('Network request recorded', { targetId, networkEntry });
    return networkEntry;
  } catch (error) {
    logger.error('Failed to record network request:', error);
    throw error;
  }
};

// パフォーマンスプロファイルの取得
const getPerformanceProfile = async (targetId) => {
  try {
    const session = debugSessions.get(targetId);
    if (!session) {
      throw new Error('Debug session not found');
    }

    // TODO: 実際のプロファイリング処理を実装
    return {
      duration: Date.now() - session.startTime,
      memoryUsage: process.memoryUsage(),
      cpuProfile: {},
      heapProfile: {}
    };
  } catch (error) {
    logger.error('Failed to get performance profile:', error);
    throw error;
  }
};

// デバッグセッション情報の取得
const getDebugInfo = (targetId) => {
  const session = debugSessions.get(targetId);
  if (!session) {
    return null;
  }

  return {
    id: session.id,
    startTime: session.startTime,
    breakpointsCount: session.breakpoints.size,
    watchesCount: session.watches.size,
    consoleLogsCount: session.consoleHistory.length,
    networkLogsCount: session.networkLogs.length
  };
};

// WebSocketクライアントへの通知
const notifyClient = (targetId, event) => {
  try {
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'DEVTOOLS_EVENT',
          targetId,
          event
        }));
      }
    });
  } catch (error) {
    logger.error('Failed to notify client:', error);
  }
};

module.exports = {
  startDebugSession,
  stopDebugSession,
  setBreakpoint,
  addWatch,
  logConsole,
  logNetwork,
  getPerformanceProfile,
  getDebugInfo,
  notifyClient
}; 