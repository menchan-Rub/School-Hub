const logger = require('./logger');
const { spawn } = require('child_process');
const path = require('path');
const EventEmitter = require('events');
const fs = require('fs');

// CEFプロセスの状態管理
let cefProcess = null;
let isInitialized = false;

class CefBrowser extends EventEmitter {
  constructor() {
    super();
    this.process = null;
    this.tabs = new Map();
    this.nextTabId = 1;
  }

  async start() {
    if (this.process) {
      logger.warn('Browser is already running');
      return;
    }

    try {
      const cefDir = path.resolve(__dirname, '../../../cef');
      const buildDir = path.join(cefDir, 'build');
      const browserPath = path.join(buildDir, 'lightweight_browser');
      
      // バイナリの存在確認
      if (!fs.existsSync(browserPath)) {
        throw new Error(`Browser binary not found at: ${browserPath}`);
      }

      // 実行権限の確認
      try {
        fs.accessSync(browserPath, fs.constants.X_OK);
      } catch (error) {
        throw new Error(`Browser binary is not executable: ${browserPath}`);
      }

      logger.info('Starting browser process:', {
        browserPath,
        cwd: buildDir
      });
      
      this.process = spawn(browserPath, [], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: buildDir // 重要: 実行ディレクトリをbuildに設定
      });

      this.process.stdout.on('data', (data) => {
        logger.info('Browser stdout:', data.toString());
      });

      this.process.stderr.on('data', (data) => {
        logger.error('Browser stderr:', data.toString());
      });

      this.process.on('close', (code) => {
        logger.info('Browser process exited with code:', code);
        this.process = null;
        this.emit('exit', code);
      });

      this.process.on('error', (error) => {
        logger.error('Browser process error:', error);
        this.process = null;
        this.emit('error', error);
      });

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Browser startup timeout'));
        }, 10000);

        this.process.stdout.once('data', () => {
          clearTimeout(timeout);
          resolve();
        });

        this.process.stderr.once('data', (data) => {
          clearTimeout(timeout);
          if (data.toString().includes('ERROR')) {
            reject(new Error(data.toString()));
          }
        });
      });
    } catch (error) {
      logger.error('Failed to start browser:', error);
      throw error;
    }
  }

  async stop() {
    if (this.process) {
      logger.info('Stopping browser process');
      this.process.kill();
      this.process = null;
    }
  }

  async handleNavigate(url) {
    if (!this.process) {
      throw new Error('Browser not started');
    }

    logger.info('Navigating to:', url);
    this.process.stdin.write(JSON.stringify({
      type: 'NAVIGATE',
      url
    }) + '\n');
  }

  async handleNewTab(url = 'about:blank') {
    if (!this.process) {
      throw new Error('Browser not started');
    }

    const tabId = this.nextTabId++;
    this.tabs.set(tabId, {
      id: tabId,
      url,
      title: '新しいタブ'
    });

    logger.info('Creating new tab:', { tabId, url });
    this.process.stdin.write(JSON.stringify({
      type: 'NEW_TAB',
      tabId,
      url
    }) + '\n');

    return tabId;
  }

  async handleCloseTab(tabId) {
    if (!this.process) {
      throw new Error('Browser not started');
    }

    if (!this.tabs.has(tabId)) {
      throw new Error('Tab not found');
    }

    logger.info('Closing tab:', tabId);
    this.tabs.delete(tabId);
    this.process.stdin.write(JSON.stringify({
      type: 'CLOSE_TAB',
      tabId
    }) + '\n');
  }

  updateTabTitle(tabId, title) {
    const tab = this.tabs.get(tabId);
    if (tab) {
      tab.title = title;
      this.emit('titleChanged', { tabId, title });
    }
  }

  updateTabFavicon(tabId, favicon) {
    const tab = this.tabs.get(tabId);
    if (tab) {
      tab.favicon = favicon;
      this.emit('faviconChanged', { tabId, favicon });
    }
  }
}

const browser = new CefBrowser();

// CEFの初期化
const initialize = async (options = {}) => {
  if (isInitialized) {
    logger.warn('CEF is already initialized');
    return;
  }

  try {
    logger.info('Initializing CEF with options:', options);

    // CEFの設定
    const settings = {
      windowless_rendering_enabled: true,
      no_sandbox: false,
      remote_debugging_port: options.debugPort || 9222,
      log_severity: process.env.NODE_ENV === 'development' ? 'info' : 'error',
      ...options
    };

    // ブラウザプロセスの起動
    await browser.start();
    
    isInitialized = true;
    logger.info('CEF initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize CEF:', error);
    throw error;
  }
};

// ブラウザウィンドウの作成
const createBrowser = async (url, options = {}) => {
  if (!isInitialized) {
    await initialize();
  }

  try {
    const tabId = await browser.handleNewTab(url);
    logger.info('Browser window created:', { tabId, url });
    return { tabId, url };
  } catch (error) {
    logger.error('Failed to create browser window:', error);
    throw error;
  }
};

// JavaScriptの実行
const executeScript = async (browserId, script) => {
  try {
    // TODO: 実際のスクリプト実行処理を実装
    logger.debug('Executing script', {
      browserId,
      script: script.substring(0, 100) + '...'
    });

    return {
      success: true,
      result: null
    };
  } catch (error) {
    logger.error('Failed to execute script:', error);
    throw error;
  }
};

// イベントハンドラの設定
const setEventHandler = (browserId, event, handler) => {
  try {
    // TODO: 実際のイベントハンドラ設定処理を実装
    logger.debug('Event handler set', {
      browserId,
      event
    });
  } catch (error) {
    logger.error('Failed to set event handler:', error);
    throw error;
  }
};

// ブラウザウィンドウの終了
const closeBrowser = async (tabId) => {
  try {
    await browser.handleCloseTab(tabId);
    logger.info('Browser window closed:', { tabId });
  } catch (error) {
    logger.error('Failed to close browser window:', error);
    throw error;
  }
};

// CEFのクリーンアップ
const cleanup = async () => {
  try {
    if (isInitialized) {
      await browser.stop();
      isInitialized = false;
      logger.info('CEF cleanup completed');
    }
  } catch (error) {
    logger.error('Failed to cleanup CEF:', error);
    throw error;
  }
};

// デバッグ情報の取得
const getDebugInfo = () => {
  return {
    isInitialized,
    processId: browser.process?.pid,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
    tabs: Array.from(browser.tabs.entries())
  };
};

module.exports = {
  initialize,
  createBrowser,
  executeScript,
  setEventHandler,
  closeBrowser,
  cleanup,
  getDebugInfo,
  browser,
  handleNavigate: (url) => browser.handleNavigate(url),
  handleNewTab: (url) => browser.handleNewTab(url),
  handleCloseTab: (tabId) => browser.handleCloseTab(tabId)
}; 