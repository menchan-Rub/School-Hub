const {
  captureFullPage,
  captureElement,
  captureSelection,
  captureViewport,
  processImage,
  saveScreenshot,
  getScreenshotHistory
} = require('../utils/screenshot');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const db = require('../utils/database');

jest.mock('../utils/logger');
jest.mock('../utils/database');
jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn(),
    readFile: jest.fn(),
    access: jest.fn(),
    mkdir: jest.fn()
  }
}));

describe('Screenshot Tests', () => {
  const testDir = path.join(__dirname, '../../test-files');
  const outputPath = path.join(testDir, 'screenshot.png');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Full Page Screenshot', () => {
    test('should capture full page screenshot', async () => {
      const url = 'https://example.com';
      const options = {
        format: 'png',
        quality: 80,
        fullPage: true
      };

      await captureFullPage(url, outputPath, options);

      expect(fs.writeFile).toHaveBeenCalledWith(
        outputPath,
        expect.any(Buffer),
        'binary'
      );
      expect(logger.info).toHaveBeenCalledWith('Full page screenshot captured:', {
        url,
        path: outputPath
      });
    });

    test('should handle capture error', async () => {
      const url = 'https://invalid-url.com';
      const error = new Error('Capture failed');
      jest.spyOn(global, 'fetch').mockRejectedValue(error);

      await expect(captureFullPage(url, outputPath))
        .rejects.toThrow('Capture failed');
      expect(logger.error).toHaveBeenCalledWith('Screenshot capture failed:', error);
    });

    test('should validate URL format', async () => {
      const invalidUrl = 'invalid-url';

      await expect(captureFullPage(invalidUrl, outputPath))
        .rejects.toThrow('Invalid URL format');
    });
  });

  describe('Element Screenshot', () => {
    test('should capture element screenshot', async () => {
      const selector = '#target-element';
      const options = {
        format: 'png',
        padding: 10
      };

      await captureElement(selector, outputPath, options);

      expect(fs.writeFile).toHaveBeenCalledWith(
        outputPath,
        expect.any(Buffer),
        'binary'
      );
      expect(logger.info).toHaveBeenCalledWith('Element screenshot captured:', {
        selector,
        path: outputPath
      });
    });

    test('should handle element not found', async () => {
      const selector = '#non-existent';

      await expect(captureElement(selector, outputPath))
        .rejects.toThrow('Element not found');
      expect(logger.error).toHaveBeenCalledWith('Element not found:', {
        selector
      });
    });

    test('should validate selector format', async () => {
      const invalidSelector = '';

      await expect(captureElement(invalidSelector, outputPath))
        .rejects.toThrow('Invalid selector');
    });
  });

  describe('Selection Screenshot', () => {
    test('should capture selection screenshot', async () => {
      const selection = {
        x: 100,
        y: 100,
        width: 500,
        height: 300
      };
      const options = {
        format: 'jpeg',
        quality: 90
      };

      await captureSelection(selection, outputPath, options);

      expect(fs.writeFile).toHaveBeenCalledWith(
        outputPath,
        expect.any(Buffer),
        'binary'
      );
      expect(logger.info).toHaveBeenCalledWith('Selection screenshot captured:', {
        selection,
        path: outputPath
      });
    });

    test('should handle invalid selection area', async () => {
      const invalidSelection = {
        x: -100,
        y: -100,
        width: 0,
        height: 0
      };

      await expect(captureSelection(invalidSelection, outputPath))
        .rejects.toThrow('Invalid selection area');
    });

    test('should validate selection coordinates', async () => {
      const selections = [
        { x: 'invalid', y: 100, width: 500, height: 300 },
        { x: 100, y: 100, width: -500, height: 300 },
        { x: 100, y: 100, width: 500, height: -300 }
      ];

      for (const selection of selections) {
        await expect(captureSelection(selection, outputPath))
          .rejects.toThrow('Invalid selection coordinates');
      }
    });
  });

  describe('Viewport Screenshot', () => {
    test('should capture viewport screenshot', async () => {
      const options = {
        format: 'png',
        scale: 2
      };

      await captureViewport(outputPath, options);

      expect(fs.writeFile).toHaveBeenCalledWith(
        outputPath,
        expect.any(Buffer),
        'binary'
      );
      expect(logger.info).toHaveBeenCalledWith('Viewport screenshot captured:', {
        path: outputPath
      });
    });

    test('should handle viewport capture error', async () => {
      const error = new Error('Capture failed');
      jest.spyOn(global, 'document').mockImplementation(() => {
        throw error;
      });

      await expect(captureViewport(outputPath))
        .rejects.toThrow('Capture failed');
      expect(logger.error).toHaveBeenCalledWith('Viewport capture failed:', error);
    });
  });

  describe('Image Processing', () => {
    test('should process screenshot image', async () => {
      const options = {
        resize: { width: 800, height: 600 },
        quality: 80,
        format: 'jpeg'
      };
      const imageBuffer = Buffer.from('test-image');

      const result = await processImage(imageBuffer, options);

      expect(result).toBeInstanceOf(Buffer);
      expect(logger.info).toHaveBeenCalledWith('Image processed:', {
        options
      });
    });

    test('should handle processing error', async () => {
      const error = new Error('Processing failed');
      jest.spyOn(global, 'ImageProcessor').mockImplementation(() => {
        throw error;
      });

      await expect(processImage(Buffer.from('test'), {}))
        .rejects.toThrow('Processing failed');
      expect(logger.error).toHaveBeenCalledWith('Image processing failed:', error);
    });

    test('should validate processing options', async () => {
      const invalidOptions = {
        resize: { width: -800, height: -600 },
        quality: 101
      };

      await expect(processImage(Buffer.from('test'), invalidOptions))
        .rejects.toThrow('Invalid processing options');
    });
  });

  describe('Screenshot Storage', () => {
    test('should save screenshot to storage', async () => {
      const screenshot = {
        userId: 1,
        url: 'https://example.com',
        path: outputPath,
        type: 'full',
        timestamp: new Date()
      };
      db.query.mockResolvedValue({ rows: [{ id: 1, ...screenshot }] });

      const result = await saveScreenshot(screenshot);

      expect(result).toHaveProperty('id');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        expect.any(Array)
      );
    });

    test('should get screenshot history', async () => {
      const userId = 1;
      const mockHistory = [
        {
          id: 1,
          url: 'https://example.com',
          path: '/path/to/screenshot1.png',
          type: 'full',
          timestamp: new Date()
        },
        {
          id: 2,
          url: 'https://example.com',
          path: '/path/to/screenshot2.png',
          type: 'element',
          timestamp: new Date()
        }
      ];
      db.query.mockResolvedValue({ rows: mockHistory });

      const result = await getScreenshotHistory(userId);

      expect(result).toEqual(mockHistory);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [userId]
      );
    });

    test('should handle storage errors', async () => {
      const error = new Error('Storage error');
      db.query.mockRejectedValue(error);

      await expect(saveScreenshot({}))
        .rejects.toThrow('Storage error');
      expect(logger.error).toHaveBeenCalledWith('Failed to save screenshot:', error);
    });
  });
}); 