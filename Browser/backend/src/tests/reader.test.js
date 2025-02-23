const {
  extractContent,
  formatContent,
  customizeReader,
  saveReaderSettings,
  getReaderSettings,
  parseArticle,
  cleanupContent,
  estimateReadingTime
} = require('../utils/reader');
const logger = require('../utils/logger');
const db = require('../utils/database');

jest.mock('../utils/logger');
jest.mock('../utils/database');

describe('Reader Mode Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Content Extraction', () => {
    test('should extract article content', async () => {
      const html = `
        <html>
          <body>
            <article>
              <h1>Test Article</h1>
              <p>This is a test paragraph.</p>
              <div class="ad">Advertisement</div>
              <p>Another paragraph.</p>
            </article>
          </body>
        </html>
      `;

      const content = await extractContent(html);

      expect(content).toHaveProperty('title', 'Test Article');
      expect(content.paragraphs).toHaveLength(2);
      expect(content.paragraphs).not.toContain('Advertisement');
      expect(logger.info).toHaveBeenCalledWith('Content extracted successfully');
    });

    test('should handle invalid HTML', async () => {
      const invalidHtml = '<invalid>';

      await expect(extractContent(invalidHtml))
        .rejects.toThrow('Invalid HTML content');
      expect(logger.error).toHaveBeenCalledWith('Content extraction failed:', expect.any(Error));
    });

    test('should extract metadata', async () => {
      const html = `
        <html>
          <head>
            <meta name="author" content="John Doe">
            <meta name="description" content="Test description">
          </head>
          <body>
            <article>
              <h1>Test Article</h1>
              <p>Content</p>
            </article>
          </body>
        </html>
      `;

      const content = await extractContent(html);

      expect(content.metadata).toEqual({
        author: 'John Doe',
        description: 'Test description'
      });
    });
  });

  describe('Content Formatting', () => {
    test('should format extracted content', () => {
      const content = {
        title: 'Test Article',
        paragraphs: [
          'First paragraph',
          'Second paragraph'
        ],
        metadata: {
          author: 'John Doe'
        }
      };
      const options = {
        fontSize: 16,
        lineHeight: 1.5,
        fontFamily: 'Arial'
      };

      const formatted = formatContent(content, options);

      expect(formatted).toContain('Test Article');
      expect(formatted).toContain('font-size: 16px');
      expect(formatted).toContain('line-height: 1.5');
      expect(formatted).toContain('font-family: Arial');
    });

    test('should apply custom styles', () => {
      const content = {
        title: 'Test Article',
        paragraphs: ['Content']
      };
      const options = {
        theme: 'dark',
        customCSS: '.article { color: white; }'
      };

      const formatted = formatContent(content, options);

      expect(formatted).toContain('color: white');
      expect(formatted).toContain('data-theme="dark"');
    });

    test('should handle empty content', () => {
      const emptyContent = {
        title: '',
        paragraphs: []
      };

      expect(() => formatContent(emptyContent))
        .toThrow('No content to format');
    });
  });

  describe('Reader Customization', () => {
    test('should customize reader settings', async () => {
      const userId = 1;
      const settings = {
        fontSize: 18,
        theme: 'light',
        fontFamily: 'Georgia',
        lineHeight: 1.6
      };

      await customizeReader(userId, settings);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.arrayContaining([userId])
      );
      expect(logger.info).toHaveBeenCalledWith('Reader settings updated:', {
        userId,
        settings
      });
    });

    test('should validate settings', async () => {
      const invalidSettings = {
        fontSize: -1,
        theme: 'invalid'
      };

      await expect(customizeReader(1, invalidSettings))
        .rejects.toThrow('Invalid reader settings');
    });

    test('should merge with default settings', async () => {
      const partialSettings = {
        fontSize: 20
      };

      await customizeReader(1, partialSettings);

      expect(db.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 20,
            theme: expect.any(String),
            fontFamily: expect.any(String)
          })
        ])
      );
    });
  });

  describe('Settings Management', () => {
    test('should save reader settings', async () => {
      const settings = {
        userId: 1,
        fontSize: 16,
        theme: 'light'
      };

      await saveReaderSettings(settings);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        expect.any(Array)
      );
      expect(logger.info).toHaveBeenCalledWith('Reader settings saved:', settings);
    });

    test('should get reader settings', async () => {
      const userId = 1;
      const mockSettings = {
        fontSize: 16,
        theme: 'light',
        fontFamily: 'Arial'
      };
      db.query.mockResolvedValue({ rows: [mockSettings] });

      const settings = await getReaderSettings(userId);

      expect(settings).toEqual(mockSettings);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [userId]
      );
    });

    test('should handle missing settings', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const settings = await getReaderSettings(1);

      expect(settings).toEqual(expect.objectContaining({
        fontSize: expect.any(Number),
        theme: expect.any(String)
      }));
    });
  });

  describe('Article Parsing', () => {
    test('should parse article structure', () => {
      const html = `
        <article>
          <h1>Main Title</h1>
          <h2>Section 1</h2>
          <p>Paragraph 1</p>
          <h2>Section 2</h2>
          <p>Paragraph 2</p>
        </article>
      `;

      const structure = parseArticle(html);

      expect(structure).toEqual({
        title: 'Main Title',
        sections: [
          {
            title: 'Section 1',
            content: 'Paragraph 1'
          },
          {
            title: 'Section 2',
            content: 'Paragraph 2'
          }
        ]
      });
    });

    test('should handle nested content', () => {
      const html = `
        <article>
          <h1>Title</h1>
          <div>
            <p>Nested paragraph</p>
            <ul>
              <li>List item 1</li>
              <li>List item 2</li>
            </ul>
          </div>
        </article>
      `;

      const structure = parseArticle(html);

      expect(structure.content).toContain('Nested paragraph');
      expect(structure.content).toContain('List item');
    });

    test('should handle malformed HTML', () => {
      const malformedHtml = '<article><h1>Title</h2></article>';

      expect(() => parseArticle(malformedHtml))
        .toThrow('Invalid article structure');
    });
  });

  describe('Content Cleanup', () => {
    test('should remove unwanted elements', () => {
      const html = `
        <div>
          <p>Keep this</p>
          <script>Remove this</script>
          <style>Remove this too</style>
          <div class="ad">And this</div>
        </div>
      `;

      const cleaned = cleanupContent(html);

      expect(cleaned).toContain('Keep this');
      expect(cleaned).not.toContain('Remove this');
      expect(cleaned).not.toContain('And this');
    });

    test('should fix relative URLs', () => {
      const html = `
        <div>
          <img src="/images/test.jpg">
          <a href="/link">Link</a>
        </div>
      `;
      const baseUrl = 'https://example.com';

      const cleaned = cleanupContent(html, baseUrl);

      expect(cleaned).toContain('https://example.com/images/test.jpg');
      expect(cleaned).toContain('https://example.com/link');
    });

    test('should preserve important attributes', () => {
      const html = `
        <div>
          <img src="test.jpg" alt="Test image" title="Test">
          <a href="link" target="_blank">Link</a>
        </div>
      `;

      const cleaned = cleanupContent(html);

      expect(cleaned).toContain('alt="Test image"');
      expect(cleaned).toContain('title="Test"');
      expect(cleaned).toContain('target="_blank"');
    });
  });

  describe('Reading Time Estimation', () => {
    test('should estimate reading time', () => {
      const content = {
        title: 'Test Article',
        paragraphs: Array(100).fill('This is a test paragraph with multiple words.')
      };

      const estimate = estimateReadingTime(content);

      expect(estimate).toHaveProperty('minutes');
      expect(estimate).toHaveProperty('wordCount');
      expect(estimate.minutes).toBeGreaterThan(0);
    });

    test('should handle different reading speeds', () => {
      const content = {
        paragraphs: Array(50).fill('Test paragraph')
      };
      const speeds = {
        slow: 100,
        normal: 200,
        fast: 300
      };

      Object.entries(speeds).forEach(([speed, wpm]) => {
        const estimate = estimateReadingTime(content, { wordsPerMinute: wpm });
        expect(estimate.speed).toBe(speed);
      });
    });

    test('should include technical content factor', () => {
      const technicalContent = {
        paragraphs: Array(20).fill('Technical terms and complex explanations')
      };

      const estimate = estimateReadingTime(technicalContent, { isTechnical: true });

      expect(estimate.minutes).toBeGreaterThan(
        estimateReadingTime(technicalContent, { isTechnical: false }).minutes
      );
    });
  });
}); 