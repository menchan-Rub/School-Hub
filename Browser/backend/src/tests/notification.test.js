const { notifyError } = require('../utils/error-handler');
const { notifyClient } = require('../utils/devtools');
const { sendAlert, recordError } = require('../utils/monitoring');
const { broadcastMessage } = require('../utils/websocket');
const logger = require('../utils/logger');
const WebSocket = require('ws');

// モックの設定
jest.mock('../utils/logger');
jest.mock('../utils/config');
jest.mock('ws', () => ({
  OPEN: 1,
  CLOSED: 3,
  Server: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    clients: new Set(),
    close: jest.fn()
  }))
}));

// monitoringConfigのモック
jest.mock('../utils/monitoring', () => {
  const originalModule = jest.requireActual('../utils/monitoring');
  const metrics = {
    errors: []
  };
  return {
    ...originalModule,
    monitoringConfig: {
      enabled: true,
      interval: 60000,
      retention: 7 * 24 * 60 * 60 * 1000,
      alerts: {
        enabled: true,
        channels: ['log', 'email']
      }
    },
    metrics,
    pruneMetrics: jest.fn()
  };
});

// error-handlerのモック
jest.mock('../utils/error-handler', () => {
  const originalModule = jest.requireActual('../utils/error-handler');
  return {
    ...originalModule,
    AppError: class AppError extends Error {
      constructor(message, status = 500, code = 'INTERNAL_ERROR') {
        super(message);
        this.name = 'AppError';
        this.status = status;
        this.code = code;
      }
    }
  };
});

describe('Notification System Tests', () => {
  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
    global.wss = {
      clients: new Set(),
      on: jest.fn(),
      close: jest.fn()
    };
  });

  afterEach(() => {
    // WebSocketサーバーのクリーンアップ
    if (global.wss) {
      global.wss.close();
    }
  });

  describe('Error Notification Tests', () => {
    test('エラー通知が正しく送信される', () => {
      const error = new Error('テストエラー');
      error.code = 'TEST_ERROR';
      error.status = 500;

      notifyError(error);

      expect(logger.error).toHaveBeenCalledWith('Error notification:', {
        name: error.name,
        message: error.message,
        code: error.code,
        status: error.status
      });
    });

    test('エラーメトリクスが正しく記録される', () => {
      const error = new Error('テストエラー');
      error.context = { userId: '123' };

      const errorMetric = recordError(error);

      expect(errorMetric).toMatchObject({
        name: error.name,
        message: error.message,
        context: error.context
      });
      expect(errorMetric.timestamp).toBeDefined();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('WebSocket Notification Tests', () => {
    let mockClient;

    beforeEach(() => {
      mockClient = {
        readyState: WebSocket.OPEN,
        send: jest.fn(),
        on: jest.fn(),
        close: jest.fn()
      };
      global.wss.clients.add(mockClient);
    });

    afterEach(() => {
      // クライアントのクリーンアップ
      mockClient.close();
      global.wss.clients.clear();
    });

    test('クライアントに正しく通知が送信される', () => {
      const targetId = 'test-target';
      const event = { type: 'TEST_EVENT', data: 'test-data' };

      notifyClient(targetId, event);

      expect(mockClient.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'DEVTOOLS_EVENT',
          targetId,
          event
        })
      );
    });

    test('切断されたクライアントには通知が送信されない', () => {
      mockClient.readyState = WebSocket.CLOSED;
      const targetId = 'test-target';
      const event = { type: 'TEST_EVENT', data: 'test-data' };

      notifyClient(targetId, event);

      expect(mockClient.send).not.toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });

    test('ブロードキャストメッセージが全クライアントに送信される', () => {
      const message = {
        type: 'BROADCAST_TEST',
        data: 'test-data'
      };

      broadcastMessage(message);

      expect(mockClient.send).toHaveBeenCalledWith(JSON.stringify(message));
      expect(logger.error).not.toHaveBeenCalled();
    });

    test('送信エラーが適切に処理される', () => {
      mockClient.send.mockImplementation(() => {
        throw new Error('送信エラー');
      });

      const message = {
        type: 'BROADCAST_TEST',
        data: 'test-data'
      };

      broadcastMessage(message);

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send message to client:',
        expect.any(Error)
      );
    });
  });

  describe('Alert System Tests', () => {
    let originalMonitoringConfig;

    beforeEach(() => {
      originalMonitoringConfig = require('../utils/monitoring').monitoringConfig;
      logger.warn.mockClear();
    });

    afterEach(() => {
      // テスト後に設定を元に戻す
      require('../utils/monitoring').monitoringConfig = originalMonitoringConfig;
    });

    test('アラートが有効な場合にログに記録される', () => {
      require('../utils/monitoring').monitoringConfig = {
        alerts: {
          enabled: true,
          channels: ['log']
        }
      };

      const alertData = {
        type: 'error',
        message: 'テストアラート'
      };

      sendAlert('error', alertData);

      expect(logger.warn).toHaveBeenCalledWith('Monitoring alert:', {
        type: 'error',
        data: alertData
      });
    });

    test('アラートが無効な場合は何も実行されない', () => {
      require('../utils/monitoring').monitoringConfig = {
        alerts: {
          enabled: false,
          channels: ['log']
        }
      };

      sendAlert('error', { message: 'テストアラート' });

      expect(logger.warn).not.toHaveBeenCalled();
    });

    test('未知のアラートチャンネルは警告ログを出力', () => {
      require('../utils/monitoring').monitoringConfig = {
        alerts: {
          enabled: true,
          channels: ['unknown']
        }
      };

      sendAlert('error', { message: 'テストアラート' });

      expect(logger.warn).toHaveBeenCalledWith(
        'Unknown alert channel:',
        'unknown'
      );
    });
  });
}); 