const request = require('supertest');
const app = require('../index');
const { Pool } = require('pg');
const logger = require('../utils/logger');

jest.mock('../utils/logger');
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    query: jest.fn(),
    end: jest.fn()
  }))
}));

describe('API Tests', () => {
  let pool;

  beforeEach(() => {
    jest.clearAllMocks();
    pool = new Pool();
  });

  describe('Bookmarks API', () => {
    test('GET /api/bookmarks should return bookmarks list', async () => {
      const mockBookmarks = [
        { id: 1, url: 'https://example.com', title: 'Example' },
        { id: 2, url: 'https://test.com', title: 'Test' }
      ];
      pool.query.mockResolvedValue({ rows: mockBookmarks });

      const response = await request(app)
        .get('/api/bookmarks')
        .expect(200);

      expect(response.body).toEqual(mockBookmarks);
    });

    test('POST /api/bookmarks should create new bookmark', async () => {
      const newBookmark = { url: 'https://example.com', title: 'Example' };
      pool.query.mockResolvedValue({ rows: [{ ...newBookmark, id: 1 }] });

      const response = await request(app)
        .post('/api/bookmarks')
        .send(newBookmark)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.url).toBe(newBookmark.url);
    });

    test('DELETE /api/bookmarks/:id should delete bookmark', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1 }] });

      await request(app)
        .delete('/api/bookmarks/1')
        .expect(200);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        expect.arrayContaining(['1'])
      );
    });
  });

  describe('History API', () => {
    test('GET /api/history should return history list', async () => {
      const mockHistory = [
        { id: 1, url: 'https://example.com', title: 'Example', visit_date: new Date() },
        { id: 2, url: 'https://test.com', title: 'Test', visit_date: new Date() }
      ];
      pool.query.mockResolvedValue({ rows: mockHistory });

      const response = await request(app)
        .get('/api/history')
        .expect(200);

      expect(response.body).toEqual(mockHistory);
    });

    test('POST /api/history should create history entry', async () => {
      const newEntry = { url: 'https://example.com', title: 'Example' };
      pool.query.mockResolvedValue({ rows: [{ ...newEntry, id: 1, visit_date: new Date() }] });

      const response = await request(app)
        .post('/api/history')
        .send(newEntry)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.url).toBe(newEntry.url);
    });

    test('DELETE /api/history should clear history', async () => {
      pool.query.mockResolvedValue({ rowCount: 5 });

      await request(app)
        .delete('/api/history')
        .expect(200);

      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('DELETE'));
    });
  });

  describe('Settings API', () => {
    test('GET /api/settings should return settings', async () => {
      const mockSettings = {
        theme: { mode: 'dark' },
        language: 'ja'
      };
      pool.query.mockResolvedValue({ rows: [
        { key: 'theme', value: { mode: 'dark' } },
        { key: 'language', value: 'ja' }
      ]});

      const response = await request(app)
        .get('/api/settings')
        .expect(200);

      expect(response.body).toEqual(mockSettings);
    });

    test('PUT /api/settings/:key should update setting', async () => {
      const setting = { value: { mode: 'light' } };
      pool.query.mockResolvedValue({ rows: [{ key: 'theme', value: setting.value }] });

      const response = await request(app)
        .put('/api/settings/theme')
        .send(setting)
        .expect(200);

      expect(response.body.value).toEqual(setting.value);
    });

    test('POST /api/settings/initialize should set default settings', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await request(app)
        .post('/api/settings/initialize')
        .expect(200);

      expect(pool.query).toHaveBeenCalledTimes(expect.any(Number));
    });
  });

  describe('Downloads API', () => {
    test('GET /api/downloads should return downloads list', async () => {
      const mockDownloads = [
        { id: 1, url: 'https://example.com/file.pdf', filename: 'file.pdf', status: 'completed' },
        { id: 2, url: 'https://test.com/image.jpg', filename: 'image.jpg', status: 'pending' }
      ];
      pool.query.mockResolvedValue({ rows: mockDownloads });

      const response = await request(app)
        .get('/api/downloads')
        .expect(200);

      expect(response.body).toEqual(mockDownloads);
    });

    test('POST /api/downloads should start download', async () => {
      const download = { url: 'https://example.com/file.pdf', filename: 'file.pdf' };
      pool.query.mockResolvedValue({ rows: [{ ...download, id: 1, status: 'pending' }] });

      const response = await request(app)
        .post('/api/downloads')
        .send(download)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('pending');
    });

    test('DELETE /api/downloads/:id should cancel download', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1 }] });

      await request(app)
        .delete('/api/downloads/1')
        .expect(200);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.arrayContaining(['1'])
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors', async () => {
      pool.query.mockRejectedValue(new Error('Database error'));

      await request(app)
        .get('/api/bookmarks')
        .expect(500);

      expect(logger.error).toHaveBeenCalled();
    });

    test('should handle validation errors', async () => {
      const invalidBookmark = { url: 'invalid-url' };

      await request(app)
        .post('/api/bookmarks')
        .send(invalidBookmark)
        .expect(400);
    });

    test('should handle not found errors', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await request(app)
        .get('/api/bookmarks/999')
        .expect(404);
    });
  });
}); 