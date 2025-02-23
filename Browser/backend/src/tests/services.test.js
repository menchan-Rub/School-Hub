const { 
  AuthService,
  BookmarkService,
  HistoryService,
  SettingsService
} = require('../services');
const db = require('../utils/database');
const logger = require('../utils/logger');
const { hashPassword, comparePassword } = require('../utils/auth');

jest.mock('../utils/logger');
jest.mock('../utils/database');
jest.mock('../utils/auth');

describe('Services Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AuthService', () => {
    const authService = new AuthService();

    test('should register new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };
      const hashedPassword = 'hashed_password';
      hashPassword.mockResolvedValue(hashedPassword);
      db.query.mockResolvedValue({ rows: [{ ...userData, id: 1 }] });

      const result = await authService.register(userData);
      expect(result).toHaveProperty('id');
      expect(result.username).toBe(userData.username);
      expect(hashPassword).toHaveBeenCalledWith(userData.password);
    });

    test('should login user successfully', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };
      const user = { id: 1, email: credentials.email, password: 'hashed_password' };
      db.query.mockResolvedValue({ rows: [user] });
      comparePassword.mockResolvedValue(true);

      const result = await authService.login(credentials);
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.id).toBe(user.id);
    });

    test('should handle invalid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrong_password'
      };
      db.query.mockResolvedValue({ rows: [{ id: 1, email: credentials.email }] });
      comparePassword.mockResolvedValue(false);

      await expect(authService.login(credentials))
        .rejects.toThrow('Invalid credentials');
    });
  });

  describe('BookmarkService', () => {
    const bookmarkService = new BookmarkService();

    test('should create bookmark successfully', async () => {
      const bookmark = {
        url: 'https://example.com',
        title: 'Example',
        userId: 1
      };
      db.query.mockResolvedValue({ rows: [{ ...bookmark, id: 1 }] });

      const result = await bookmarkService.create(bookmark);
      expect(result).toHaveProperty('id');
      expect(result.url).toBe(bookmark.url);
      expect(result.title).toBe(bookmark.title);
    });

    test('should get user bookmarks', async () => {
      const userId = 1;
      const mockBookmarks = [
        { id: 1, url: 'https://example.com', title: 'Example', userId },
        { id: 2, url: 'https://test.com', title: 'Test', userId }
      ];
      db.query.mockResolvedValue({ rows: mockBookmarks });

      const result = await bookmarkService.getByUserId(userId);
      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe(userId);
    });

    test('should delete bookmark successfully', async () => {
      const bookmarkId = 1;
      const userId = 1;
      db.query.mockResolvedValue({ rows: [{ id: bookmarkId }] });

      await bookmarkService.delete(bookmarkId, userId);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        [bookmarkId, userId]
      );
    });
  });

  describe('HistoryService', () => {
    const historyService = new HistoryService();

    test('should add history entry successfully', async () => {
      const entry = {
        url: 'https://example.com',
        title: 'Example',
        userId: 1
      };
      db.query.mockResolvedValue({ rows: [{ ...entry, id: 1, visitDate: new Date() }] });

      const result = await historyService.add(entry);
      expect(result).toHaveProperty('id');
      expect(result.url).toBe(entry.url);
      expect(result.title).toBe(entry.title);
    });

    test('should get user history', async () => {
      const userId = 1;
      const mockHistory = [
        { id: 1, url: 'https://example.com', title: 'Example', userId, visitDate: new Date() },
        { id: 2, url: 'https://test.com', title: 'Test', userId, visitDate: new Date() }
      ];
      db.query.mockResolvedValue({ rows: mockHistory });

      const result = await historyService.getByUserId(userId);
      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe(userId);
    });

    test('should clear user history', async () => {
      const userId = 1;
      db.query.mockResolvedValue({ rowCount: 5 });

      await historyService.clear(userId);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        [userId]
      );
    });
  });

  describe('SettingsService', () => {
    const settingsService = new SettingsService();

    test('should get user settings', async () => {
      const userId = 1;
      const mockSettings = [
        { key: 'theme', value: { mode: 'dark' }, userId },
        { key: 'language', value: 'ja', userId }
      ];
      db.query.mockResolvedValue({ rows: mockSettings });

      const result = await settingsService.getByUserId(userId);
      expect(result).toHaveProperty('theme');
      expect(result).toHaveProperty('language');
      expect(result.theme.mode).toBe('dark');
    });

    test('should update setting successfully', async () => {
      const userId = 1;
      const key = 'theme';
      const value = { mode: 'light' };
      db.query.mockResolvedValue({ rows: [{ key, value, userId }] });

      const result = await settingsService.update(userId, key, value);
      expect(result.key).toBe(key);
      expect(result.value).toEqual(value);
    });

    test('should initialize default settings', async () => {
      const userId = 1;
      const defaultSettings = {
        theme: { mode: 'light' },
        language: 'en',
        notifications: { enabled: true }
      };
      db.query.mockResolvedValue({ rows: [] });

      await settingsService.initialize(userId);
      expect(db.query).toHaveBeenCalledTimes(Object.keys(defaultSettings).length);
    });
  });
}); 