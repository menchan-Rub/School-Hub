const WebSocket = require('ws');
const { WebSocketServer } = require('ws');
const { createWebSocketServer, handleConnection, handleMessage, handleError } = require('../websocket');
const { verifyToken } = require('../utils/auth');
const logger = require('../utils/logger');

jest.mock('../utils/auth');
jest.mock('../utils/logger');
jest.mock('ws');

describe('WebSocket Tests', () => {
  let wss;
  let ws;
  let req;

  beforeEach(() => {
    wss = new WebSocketServer();
    ws = new WebSocket('ws://localhost:8080');
    req = {
      headers: {
        'sec-websocket-protocol': 'token.valid_token'
      },
      url: '/ws'
    };
    jest.clearAllMocks();
  });

  describe('WebSocket Server Creation', () => {
    test('should create WebSocket server successfully', () => {
      const server = createWebSocketServer();

      expect(server).toBeInstanceOf(WebSocketServer);
      expect(server.options).toEqual(expect.objectContaining({
        path: '/ws',
        clientTracking: true
      }));
    });

    test('should set up event handlers', () => {
      const server = createWebSocketServer();

      expect(server.on).toHaveBeenCalledWith('connection', expect.any(Function));
      expect(server.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    test('should handle server errors', () => {
      const server = createWebSocketServer();
      const error = new Error('Server error');

      server.emit('error', error);

      expect(logger.error).toHaveBeenCalledWith(
        'WebSocket server error:',
        expect.objectContaining({ error })
      );
    });
  });

  describe('Connection Handling', () => {
    test('should authenticate connection with valid token', () => {
      const token = 'valid_token';
      const decoded = { userId: 1 };
      verifyToken.mockReturnValue(decoded);

      handleConnection(ws, req);

      expect(ws.userId).toBe(decoded.userId);
      expect(logger.info).toHaveBeenCalledWith(
        'Client connected',
        expect.any(Object)
      );
    });

    test('should reject connection with invalid token', () => {
      verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      handleConnection(ws, req);

      expect(ws.close).toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        'Authentication failed',
        expect.any(Object)
      );
    });

    test('should handle connection close', () => {
      handleConnection(ws, req);
      ws.emit('close');

      expect(logger.info).toHaveBeenCalledWith(
        'Client disconnected',
        expect.any(Object)
      );
    });

    test('should set up ping/pong', () => {
      handleConnection(ws, req);

      expect(ws.on).toHaveBeenCalledWith('pong', expect.any(Function));
      expect(ws.ping).toHaveBeenCalled();
    });
  });

  describe('Message Handling', () => {
    test('should handle valid JSON message', () => {
      const message = JSON.stringify({
        type: 'test',
        data: { key: 'value' }
      });

      handleMessage(ws, message);

      expect(ws.send).toHaveBeenCalledWith(
        expect.stringContaining('acknowledgement')
      );
    });

    test('should handle invalid JSON message', () => {
      const message = 'invalid json';

      handleMessage(ws, message);

      expect(ws.send).toHaveBeenCalledWith(
        expect.stringContaining('error')
      );
    });

    test('should handle different message types', () => {
      const messages = [
        { type: 'ping', data: {} },
        { type: 'notification', data: { message: 'test' } },
        { type: 'request', data: { action: 'test' } }
      ];

      messages.forEach(msg => {
        handleMessage(ws, JSON.stringify(msg));
        expect(ws.send).toHaveBeenCalled();
      });
    });

    test('should validate message schema', () => {
      const invalidMessage = JSON.stringify({
        type: 'test',
        data: null // should be an object
      });

      handleMessage(ws, invalidMessage);

      expect(ws.send).toHaveBeenCalledWith(
        expect.stringContaining('validation error')
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle WebSocket errors', () => {
      const error = new Error('WebSocket error');

      handleError(ws, error);

      expect(logger.error).toHaveBeenCalledWith(
        'WebSocket error:',
        expect.objectContaining({ error })
      );
      expect(ws.close).toHaveBeenCalled();
    });

    test('should handle message processing errors', () => {
      const message = JSON.stringify({
        type: 'error',
        data: { trigger: 'error' }
      });

      handleMessage(ws, message);

      expect(ws.send).toHaveBeenCalledWith(
        expect.stringContaining('error')
      );
      expect(logger.error).toHaveBeenCalled();
    });

    test('should handle connection timeout', () => {
      handleConnection(ws, req);
      jest.advanceTimersByTime(31000); // Exceed 30s timeout

      expect(ws.terminate).toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        'Client connection timeout',
        expect.any(Object)
      );
    });
  });

  describe('Broadcast Functionality', () => {
    test('should broadcast message to all clients', () => {
      const clients = new Set([
        new WebSocket('ws://localhost:8080'),
        new WebSocket('ws://localhost:8080'),
        new WebSocket('ws://localhost:8080')
      ]);
      wss.clients = clients;

      const message = {
        type: 'broadcast',
        data: { message: 'test' }
      };

      wss.broadcast(JSON.stringify(message));

      clients.forEach(client => {
        expect(client.send).toHaveBeenCalledWith(
          expect.stringContaining('broadcast')
        );
      });
    });

    test('should broadcast to specific clients', () => {
      const clients = new Set([
        Object.assign(new WebSocket('ws://localhost:8080'), { userId: 1 }),
        Object.assign(new WebSocket('ws://localhost:8080'), { userId: 2 }),
        Object.assign(new WebSocket('ws://localhost:8080'), { userId: 3 })
      ]);
      wss.clients = clients;

      const message = {
        type: 'notification',
        data: { message: 'test' },
        recipients: [1, 2]
      };

      wss.broadcast(JSON.stringify(message));

      let sentCount = 0;
      clients.forEach(client => {
        if (message.recipients.includes(client.userId)) {
          expect(client.send).toHaveBeenCalled();
          sentCount++;
        }
      });
      expect(sentCount).toBe(2);
    });
  });
}); 