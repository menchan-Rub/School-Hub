const logger = require('./logger');
const { spawn } = require('child_process');
const path = require('path');
const EventEmitter = require('events');

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
    const browserPath = path.resolve(__dirname, '../../../cef/build/lightweight_browser');
    
    this.process = spawn(browserPath, [], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.process.stdout.on('data', (data) => {
      console.log('Browser stdout:', data.toString());
    });

    this.process.stderr.on('data', (data) => {
      console.error('Browser stderr:', data.toString());
    });

    this.process.on('close', (code) => {
      console.log('Browser process exited with code:', code);
      this.emit('exit', code);
    });

    return new Promise((resolve) => {
      this.process.stdout.once('data', () => {
        resolve();
      });
    });
  }

  async stop() {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }

  async handleNavigate(url) {
    if (!this.process) {
      throw new Error('Browser not started');
    }

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
const initialize = (options = {}) => {
  if (isInitialized) {
    logger.warn('CEF is already initialized');
    return;
  }

  try {
    // CEFの設定
    const settings = {
      windowless_rendering_enabled: true,
      no_sandbox: false,
      remote_debugging_port: options.debugPort || 9222,
      log_severity: process.env.NODE_ENV === 'development' ? 'info' : 'error',
      ...options
    };

    // TODO: CEFの実際の初期化処理を実装
    isInitialized = true;
    logger.info('CEF initialized successfully', settings);
  } catch (error) {
    logger.error('Failed to initialize CEF:', error);
    throw error;
  }
};

// ブラウザウィンドウの作成
const createBrowser = async (url, options = {}) => {
  if (!isInitialized) {
    throw new Error('CEF is not initialized');
  }

  try {
    // ブラウザ設定
    const browserSettings = {
      width: options.width || 1280,
      height: options.height || 720,
      webSecurity: true,
      javascript: true,
      applicationCache: true,
      webgl: true,
      ...options
    };

    // TODO: 実際のブラウザウィンドウ作成処理を実装
    logger.info('Browser window created', {
      url,
      settings: browserSettings
    });

    return {
      id: Date.now(),
      url,
      settings: browserSettings
    };
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
const closeBrowser = async (browserId) => {
  try {
    // TODO: 実際のブラウザウィンドウ終了処理を実装
    logger.info('Browser window closed', { browserId });
  } catch (error) {
    logger.error('Failed to close browser window:', error);
    throw error;
  }
};

// CEFのクリーンアップ
const cleanup = () => {
  try {
    if (cefProcess) {
      // TODO: 実際のCEFクリーンアップ処理を実装
      cefProcess = null;
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
    processId: cefProcess?.pid,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime()
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