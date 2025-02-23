const {
  translateText,
  detectLanguage,
  getTranslationHistory,
  saveTranslation,
  getSupportedLanguages,
  translatePage,
  translateSelection
} = require('../utils/translate');
const logger = require('../utils/logger');
const db = require('../utils/database');

jest.mock('../utils/logger');
jest.mock('../utils/database');

describe('Translation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Text Translation', () => {
    test('should translate text successfully', async () => {
      const text = 'Hello, world!';
      const from = 'en';
      const to = 'ja';
      const expectedTranslation = 'こんにちは、世界！';

      const result = await translateText(text, from, to);

      expect(result).toBe(expectedTranslation);
      expect(logger.info).toHaveBeenCalledWith('Text translated:', {
        from,
        to,
        length: text.length
      });
    });

    test('should handle translation error', async () => {
      const text = 'Invalid text';
      const error = new Error('Translation failed');
      jest.spyOn(global, 'fetch').mockRejectedValue(error);

      await expect(translateText(text, 'en', 'ja'))
        .rejects.toThrow('Translation failed');
      expect(logger.error).toHaveBeenCalledWith('Translation failed:', error);
    });

    test('should validate input parameters', async () => {
      const invalidCases = [
        { text: '', from: 'en', to: 'ja' },
        { text: 'Hello', from: 'invalid', to: 'ja' },
        { text: 'Hello', from: 'en', to: 'invalid' }
      ];

      for (const params of invalidCases) {
        await expect(translateText(params.text, params.from, params.to))
          .rejects.toThrow('Invalid parameters');
      }
    });
  });

  describe('Language Detection', () => {
    test('should detect language correctly', async () => {
      const text = 'こんにちは、世界！';
      const expectedLanguage = 'ja';

      const result = await detectLanguage(text);

      expect(result).toBe(expectedLanguage);
      expect(logger.info).toHaveBeenCalledWith('Language detected:', {
        language: expectedLanguage,
        confidence: expect.any(Number)
      });
    });

    test('should handle detection error', async () => {
      const text = '';
      const error = new Error('Detection failed');
      jest.spyOn(global, 'fetch').mockRejectedValue(error);

      await expect(detectLanguage(text))
        .rejects.toThrow('Detection failed');
      expect(logger.error).toHaveBeenCalledWith('Language detection failed:', error);
    });

    test('should validate input text', async () => {
      const invalidText = '';

      await expect(detectLanguage(invalidText))
        .rejects.toThrow('Invalid text');
    });
  });

  describe('Translation History', () => {
    test('should get translation history', async () => {
      const userId = 1;
      const mockHistory = [
        {
          id: 1,
          text: 'Hello',
          translation: 'こんにちは',
          fromLang: 'en',
          toLang: 'ja',
          timestamp: new Date()
        },
        {
          id: 2,
          text: 'World',
          translation: '世界',
          fromLang: 'en',
          toLang: 'ja',
          timestamp: new Date()
        }
      ];
      db.query.mockResolvedValue({ rows: mockHistory });

      const result = await getTranslationHistory(userId);

      expect(result).toEqual(mockHistory);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [userId]
      );
    });

    test('should save translation to history', async () => {
      const translation = {
        userId: 1,
        text: 'Hello',
        translation: 'こんにちは',
        fromLang: 'en',
        toLang: 'ja'
      };
      db.query.mockResolvedValue({ rows: [{ id: 1, ...translation }] });

      const result = await saveTranslation(translation);

      expect(result).toHaveProperty('id');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        expect.any(Array)
      );
    });

    test('should handle database errors', async () => {
      const error = new Error('Database error');
      db.query.mockRejectedValue(error);

      await expect(getTranslationHistory(1))
        .rejects.toThrow('Database error');
      expect(logger.error).toHaveBeenCalledWith('Failed to get translation history:', error);
    });
  });

  describe('Supported Languages', () => {
    test('should get supported languages', async () => {
      const mockLanguages = [
        { code: 'en', name: 'English' },
        { code: 'ja', name: 'Japanese' },
        { code: 'zh', name: 'Chinese' }
      ];
      jest.spyOn(global, 'fetch').mockResolvedValue({
        json: () => Promise.resolve(mockLanguages)
      });

      const result = await getSupportedLanguages();

      expect(result).toEqual(mockLanguages);
      expect(logger.info).toHaveBeenCalledWith('Supported languages fetched:', {
        count: mockLanguages.length
      });
    });

    test('should cache supported languages', async () => {
      await getSupportedLanguages();
      await getSupportedLanguages();

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('should handle fetch error', async () => {
      const error = new Error('Fetch failed');
      jest.spyOn(global, 'fetch').mockRejectedValue(error);

      await expect(getSupportedLanguages())
        .rejects.toThrow('Fetch failed');
      expect(logger.error).toHaveBeenCalledWith('Failed to fetch supported languages:', error);
    });
  });

  describe('Page Translation', () => {
    test('should translate entire page', async () => {
      const url = 'https://example.com';
      const from = 'en';
      const to = 'ja';
      const mockContent = {
        title: 'Example',
        content: 'Hello, world!'
      };
      const mockTranslation = {
        title: 'サンプル',
        content: 'こんにちは、世界！'
      };

      jest.spyOn(global, 'fetch')
        .mockResolvedValueOnce({ json: () => Promise.resolve(mockContent) })
        .mockResolvedValueOnce({ json: () => Promise.resolve(mockTranslation) });

      const result = await translatePage(url, from, to);

      expect(result).toEqual(mockTranslation);
      expect(logger.info).toHaveBeenCalledWith('Page translated:', {
        url,
        from,
        to
      });
    });

    test('should handle page translation error', async () => {
      const error = new Error('Translation failed');
      jest.spyOn(global, 'fetch').mockRejectedValue(error);

      await expect(translatePage('https://example.com', 'en', 'ja'))
        .rejects.toThrow('Translation failed');
      expect(logger.error).toHaveBeenCalledWith('Page translation failed:', error);
    });
  });

  describe('Selection Translation', () => {
    test('should translate selected text', async () => {
      const text = 'Selected text';
      const from = 'en';
      const to = 'ja';
      const mockTranslation = '選択されたテキスト';

      const result = await translateSelection(text, from, to);

      expect(result).toBe(mockTranslation);
      expect(logger.info).toHaveBeenCalledWith('Selection translated:', {
        from,
        to,
        length: text.length
      });
    });

    test('should handle selection translation error', async () => {
      const error = new Error('Translation failed');
      jest.spyOn(global, 'fetch').mockRejectedValue(error);

      await expect(translateSelection('Selected text', 'en', 'ja'))
        .rejects.toThrow('Translation failed');
      expect(logger.error).toHaveBeenCalledWith('Selection translation failed:', error);
    });

    test('should validate selection length', async () => {
      const longText = 'a'.repeat(5001); // Exceeds maximum length

      await expect(translateSelection(longText, 'en', 'ja'))
        .rejects.toThrow('Selection too long');
    });
  });
}); 