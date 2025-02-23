const {
  authenticate,
  authorize,
  validateRequest,
  handleError,
  logRequest,
  rateLimit,
  cors,
  compression
} = require('../middleware');
const { verifyToken } = require('../utils/auth');
const logger = require('../utils/logger');

jest.mock('../utils/auth');
jest.mock('../utils/logger');

describe('Middleware Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      body: {},
      ip: '127.0.0.1',
      method: 'GET',
      path: '/test'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('Authentication Middleware', () => {
    test('should authenticate valid token', () => {
      const token = 'valid_token';
      const decoded = { userId: 1 };
      req.headers.authorization = `Bearer ${token}`;
      verifyToken.mockReturnValue(decoded);

      authenticate(req, res, next);

      expect(req.user).toEqual(decoded);
      expect(next).toHaveBeenCalled();
    });

    test('should reject invalid token', () => {
      req.headers.authorization = 'Bearer invalid_token';
      verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.any(String)
      }));
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle missing token', () => {
      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'No token provided'
      }));
    });
  });

  describe('Authorization Middleware', () => {
    test('should authorize user with required role', () => {
      req.user = { roles: ['admin'] };
      const middleware = authorize(['admin']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should reject user without required role', () => {
      req.user = { roles: ['user'] };
      const middleware = authorize(['admin']);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.any(String)
      }));
    });
  });

  describe('Request Validation Middleware', () => {
    test('should validate request body', () => {
      const schema = {
        email: { type: 'string', required: true },
        password: { type: 'string', required: true }
      };
      req.body = { email: 'test@example.com', password: 'password123' };
      const middleware = validateRequest(schema);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should reject invalid request body', () => {
      const schema = {
        email: { type: 'string', required: true },
        password: { type: 'string', required: true }
      };
      req.body = { email: 'test@example.com' }; // missing password
      const middleware = validateRequest(schema);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.any(String)
      }));
    });
  });

  describe('Error Handling Middleware', () => {
    test('should handle known errors', () => {
      const error = new Error('Known error');
      error.statusCode = 400;

      handleError(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Known error'
      }));
    });

    test('should handle unknown errors', () => {
      const error = new Error('Unknown error');

      handleError(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Internal server error'
      }));
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Request Logging Middleware', () => {
    test('should log request details', () => {
      logRequest(req, res, next);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining(req.method),
        expect.objectContaining({
          method: req.method,
          path: req.path,
          ip: req.ip
        })
      );
      expect(next).toHaveBeenCalled();
    });

    test('should log request duration', () => {
      const startTime = Date.now();
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(startTime)
        .mockReturnValueOnce(startTime + 100);

      logRequest(req, res, next);
      res.emit('finish');

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Request completed'),
        expect.objectContaining({
          duration: 100
        })
      );
    });
  });

  describe('Rate Limiting Middleware', () => {
    test('should allow requests within limit', () => {
      const middleware = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100
      });

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should block requests over limit', () => {
      const middleware = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 1
      });

      // First request
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();

      // Second request
      next.mockClear();
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.any(String)
      }));
    });
  });

  describe('CORS Middleware', () => {
    test('should set CORS headers', () => {
      cors(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        expect.any(String)
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Methods',
        expect.any(String)
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Headers',
        expect.any(String)
      );
      expect(next).toHaveBeenCalled();
    });

    test('should handle preflight requests', () => {
      req.method = 'OPTIONS';
      cors(req, res, next);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('Compression Middleware', () => {
    test('should compress response', () => {
      compression(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Encoding',
        expect.any(String)
      );
      expect(next).toHaveBeenCalled();
    });

    test('should skip compression for small responses', () => {
      req.headers['content-length'] = '100'; // Small response
      compression(req, res, next);

      expect(res.setHeader).not.toHaveBeenCalledWith(
        'Content-Encoding',
        expect.any(String)
      );
      expect(next).toHaveBeenCalled();
    });
  });
}); 