const logger = require('./logger');
const vm = require('vm');

// スクリプト実行コンテキストの管理
let contexts = new Map();

// コンテキストの作成
const createContext = async (contextId, options = {}) => {
  try {
    // 基本的なグローバルオブジェクトを設定
    const sandbox = {
      console: {
        log: (...args) => logger.info('Script log:', ...args),
        error: (...args) => logger.error('Script error:', ...args),
        warn: (...args) => logger.warn('Script warning:', ...args),
        info: (...args) => logger.info('Script info:', ...args),
        debug: (...args) => logger.debug('Script debug:', ...args)
      },
      setTimeout: (callback, delay) => setTimeout(callback, delay),
      clearTimeout: (id) => clearTimeout(id),
      setInterval: (callback, delay) => setInterval(callback, delay),
      clearInterval: (id) => clearInterval(id),
      ...options.globals
    };

    // コンテキストを作成
    const context = vm.createContext(sandbox);
    contexts.set(contextId, {
      context,
      scripts: new Map(),
      timeouts: new Set(),
      intervals: new Set()
    });

    logger.info('Context created', { contextId, options });
    return context;
  } catch (error) {
    logger.error('Failed to create context:', error);
    throw error;
  }
};

// スクリプトの実行
const executeScript = async (contextId, script, options = {}) => {
  try {
    const contextData = contexts.get(contextId);
    if (!contextData) {
      throw new Error('Context not found');
    }

    // スクリプトをコンパイル
    const compiledScript = new vm.Script(script, {
      filename: options.filename || 'script.js',
      lineOffset: options.lineOffset || 0,
      columnOffset: options.columnOffset || 0,
      timeout: options.timeout || 5000
    });

    // スクリプトを実行
    const result = compiledScript.runInContext(contextData.context, {
      timeout: options.timeout || 5000
    });

    logger.debug('Script executed', { contextId, result });
    return result;
  } catch (error) {
    logger.error('Failed to execute script:', error);
    throw error;
  }
};

// スクリプトの評価
const evaluateExpression = async (contextId, expression) => {
  try {
    const contextData = contexts.get(contextId);
    if (!contextData) {
      throw new Error('Context not found');
    }

    const result = vm.runInContext(expression, contextData.context, {
      timeout: 1000
    });

    logger.debug('Expression evaluated', { contextId, expression, result });
    return result;
  } catch (error) {
    logger.error('Failed to evaluate expression:', error);
    throw error;
  }
};

// グローバル変数の設定
const setGlobal = async (contextId, name, value) => {
  try {
    const contextData = contexts.get(contextId);
    if (!contextData) {
      throw new Error('Context not found');
    }

    contextData.context[name] = value;
    logger.debug('Global variable set', { contextId, name, value });
    return true;
  } catch (error) {
    logger.error('Failed to set global variable:', error);
    throw error;
  }
};

// グローバル変数の取得
const getGlobal = async (contextId, name) => {
  try {
    const contextData = contexts.get(contextId);
    if (!contextData) {
      throw new Error('Context not found');
    }

    return contextData.context[name];
  } catch (error) {
    logger.error('Failed to get global variable:', error);
    throw error;
  }
};

// コンテキストのクリーンアップ
const cleanupContext = async (contextId) => {
  try {
    const contextData = contexts.get(contextId);
    if (!contextData) {
      return false;
    }

    // タイマーをクリア
    contextData.timeouts.forEach(clearTimeout);
    contextData.intervals.forEach(clearInterval);

    // コンテキストを削除
    contexts.delete(contextId);
    logger.info('Context cleaned up', { contextId });
    return true;
  } catch (error) {
    logger.error('Failed to cleanup context:', error);
    throw error;
  }
};

// スクリプトの実行状態を監視
const monitorExecution = (contextId) => {
  const contextData = contexts.get(contextId);
  if (!contextData) {
    return null;
  }

  return {
    activeTimeouts: contextData.timeouts.size,
    activeIntervals: contextData.intervals.size,
    scriptCount: contextData.scripts.size
  };
};

// エラーハンドリング用のラッパー
const wrapScript = (script) => {
  return `
    try {
      ${script}
    } catch (error) {
      console.error('Script execution error:', error);
      throw error;
    }
  `;
};

module.exports = {
  createContext,
  executeScript,
  evaluateExpression,
  setGlobal,
  getGlobal,
  cleanupContext,
  monitorExecution,
  wrapScript
}; 