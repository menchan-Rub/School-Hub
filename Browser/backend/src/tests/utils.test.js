const {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken
} = require('../utils/auth');
const {
  encrypt,
  decrypt
} = require('../utils/crypto');
const {
  validateEmail,
  validatePassword,
  validateUrl,
  sanitizeInput
} = require('../utils/validation');
const {
  formatDate,
  parseDate,
  isValidDate,
  getDateRange
} = require('../utils/date');
const logger = require('../utils/logger');

jest.mock('../utils/logger');

describe('Utils Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Auth Utils', () => {
    test('should hash password correctly', async () => {
      const password = 'password123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(typeof hash).toBe('string');
    });

    test('should compare password correctly', async () => {
      const password = 'password123';
      const hash = await hashPassword(password);

      const isValid = await comparePassword(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await comparePassword('wrong_password', hash);
      expect(isInvalid).toBe(false);
    });

    test('should generate valid JWT token', () => {
      const payload = { userId: 1, email: 'test@example.com' };
      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    test('should verify JWT token correctly', () => {
      const payload = { userId: 1, email: 'test@example.com' };
      const token = generateToken(payload);

      const decoded = verifyToken(token);
      expect(decoded).toMatchObject(payload);
    });

    test('should throw error for invalid token', () => {
      expect(() => verifyToken('invalid_token')).toThrow();
    });
  });

  describe('Crypto Utils', () => {
    test('should encrypt and decrypt data correctly', () => {
      const data = 'sensitive data';
      const encrypted = encrypt(data);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(data);

      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(data);
    });

    test('should handle different data types', () => {
      const testCases = [
        'string data',
        123,
        { key: 'value' },
        ['array', 'data'],
        true
      ];

      testCases.forEach(data => {
        const encrypted = encrypt(data);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toEqual(data);
      });
    });

    test('should throw error for invalid encrypted data', () => {
      expect(() => decrypt('invalid_data')).toThrow();
    });
  });

  describe('Validation Utils', () => {
    test('should validate email correctly', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.jp',
        'user+tag@domain.com'
      ];
      const invalidEmails = [
        'invalid_email',
        '@domain.com',
        'user@',
        'user@domain'
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });

    test('should validate password correctly', () => {
      const validPasswords = [
        'Password123!',
        'Complex@Pass1',
        'Secure123Password!'
      ];
      const invalidPasswords = [
        'short',
        'no_numbers',
        'no-uppercase',
        'NO-LOWERCASE'
      ];

      validPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(true);
      });

      invalidPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(false);
      });
    });

    test('should validate URL correctly', () => {
      const validUrls = [
        'https://example.com',
        'http://sub.domain.co.jp/path',
        'https://domain.com/path?query=value'
      ];
      const invalidUrls = [
        'invalid_url',
        'ftp://domain.com',
        'not-a-url',
        'http://'
      ];

      validUrls.forEach(url => {
        expect(validateUrl(url)).toBe(true);
      });

      invalidUrls.forEach(url => {
        expect(validateUrl(url)).toBe(false);
      });
    });

    test('should sanitize input correctly', () => {
      const testCases = [
        {
          input: '<script>alert("xss")</script>',
          expected: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
        },
        {
          input: 'Normal text',
          expected: 'Normal text'
        },
        {
          input: 'Text with <tags>',
          expected: 'Text with &lt;tags&gt;'
        }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(sanitizeInput(input)).toBe(expected);
      });
    });
  });

  describe('Date Utils', () => {
    test('should format date correctly', () => {
      const date = new Date('2024-02-20T12:34:56');
      const formatted = formatDate(date);

      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
      expect(formatted).toBe('2024-02-20 12:34:56');
    });

    test('should parse date correctly', () => {
      const dateStr = '2024-02-20 12:34:56';
      const parsed = parseDate(dateStr);

      expect(parsed).toBeInstanceOf(Date);
      expect(parsed.getFullYear()).toBe(2024);
      expect(parsed.getMonth()).toBe(1); // 0-based month
      expect(parsed.getDate()).toBe(20);
    });

    test('should validate date correctly', () => {
      const validDates = [
        '2024-02-20',
        '2024/02/20',
        '2024-02-20 12:34:56'
      ];
      const invalidDates = [
        'invalid_date',
        '2024-13-20',
        '2024-02-31'
      ];

      validDates.forEach(date => {
        expect(isValidDate(date)).toBe(true);
      });

      invalidDates.forEach(date => {
        expect(isValidDate(date)).toBe(false);
      });
    });

    test('should get date range correctly', () => {
      const start = new Date('2024-02-01');
      const end = new Date('2024-02-29');
      const range = getDateRange(start, end);

      expect(range).toHaveLength(29);
      expect(range[0]).toEqual(start);
      expect(range[range.length - 1]).toEqual(end);
    });

    test('should handle invalid date range', () => {
      const start = new Date('2024-02-29');
      const end = new Date('2024-02-01');

      expect(() => getDateRange(start, end)).toThrow();
    });
  });
}); 