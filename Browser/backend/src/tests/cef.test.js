const {
  initialize,
  createBrowser,
  executeScript,
  setEventHandler,
  closeBrowser,
  cleanup,
  getDebugInfo
} = require('../utils/cef');
const logger = require('../utils/logger');

// モックの設定
jest.mock('../utils/logger');

describe('CEF Tests', () => {
  let browser;

  beforeEach(() => {
    // ブラウザモックの設定
    browser = {
      id: 'test-browser-id',
      loadURL: jest.fn(),
      executeScript: jest.fn(),
      close: jest.fn(),
      focus: jest.fn(),
      isDestroyed: jest.fn().mockReturnValue(false),
      webContents: {
        on: jest.fn(),
        session: {
          setPermissionRequestHandler: jest.fn()
        }
      }
    };
    jest.clearAllMocks();
  });

  describe('初期化テスト', () => {
    test('CEFが正しく初期化される', async () => {
      const options = {
        windowless: true,
        remoteDebugging: true
      };

      await initialize(options);
      expect(logger.info).toHaveBeenCalledWith('CEF initialized', expect.any(Object));
    });

    test('無効なオプションで初期化が失敗する', async () => {
      const invalidOptions = {
        invalidOption: true
      };

      await expect(initialize(invalidOptions)).rejects.toThrow();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('ブラウザ作成テスト', () => {
    test('新しいブラウザインスタンスが作成される', async () => {
      const url = 'https://example.com';
      const options = {
        width: 1280,
        height: 720,
        headless: true
      };

      const newBrowser = await createBrowser(url, options);
      expect(newBrowser).toBeDefined();
      expect(newBrowser.id).toBeDefined();
      expect(logger.info).toHaveBeenCalledWith('Browser created', expect.any(Object));
    });

    test('無効なURLでブラウザ作成が失敗する', async () => {
      const invalidUrl = 'invalid-url';
      await expect(createBrowser(invalidUrl)).rejects.toThrow();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('スクリプト実行テスト', () => {
    test('JavaScriptが正しく実行される', async () => {
      const script = 'document.title';
      const expectedResult = 'Test Page';
      browser.executeScript.mockResolvedValue({ result: expectedResult });

      const result = await executeScript(browser.id, script);
      expect(result.result).toBe(expectedResult);
      expect(logger.debug).toHaveBeenCalledWith('Script executed', expect.any(Object));
    });

    test('スクリプト実行エラーが適切に処理される', async () => {
      const script = 'invalid.script';
      browser.executeScript.mockRejectedValue(new Error('Script error'));

      await expect(executeScript(browser.id, script)).rejects.toThrow();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('イベントハンドラテスト', () => {
    test('イベントハンドラが正しく設定される', () => {
      const event = 'load';
      const handler = jest.fn();

      setEventHandler(browser.id, event, handler);
      expect(logger.debug).toHaveBeenCalledWith('Event handler set', expect.any(Object));
    });

    test('無効なイベントタイプでエラーが発生する', () => {
      const invalidEvent = 'invalid-event';
      const handler = jest.fn();

      expect(() => setEventHandler(browser.id, invalidEvent, handler)).toThrow();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('ブラウザ終了テスト', () => {
    test('ブラウザが正しく終了する', async () => {
      await closeBrowser(browser.id);
      expect(logger.info).toHaveBeenCalledWith('Browser closed', expect.any(Object));
    });

    test('存在しないブラウザIDでエラーが発生する', async () => {
      const invalidId = 'invalid-id';
      await expect(closeBrowser(invalidId)).rejects.toThrow();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('クリーンアップテスト', () => {
    test('全てのリソースが正しくクリーンアップされる', async () => {
      await cleanup();
      expect(logger.info).toHaveBeenCalledWith('CEF cleanup completed');
    });
  });

  describe('デバッグ情報テスト', () => {
    test('デバッグ情報が正しく取得される', () => {
      const debugInfo = getDebugInfo();
      expect(debugInfo).toHaveProperty('browsers');
      expect(debugInfo).toHaveProperty('memory');
      expect(debugInfo).toHaveProperty('performance');
    });
  });
}); 