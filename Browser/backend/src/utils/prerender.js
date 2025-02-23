const logger = require('./logger');
const cef = require('./cef');

// プリレンダリングキャッシュ
const prerenderCache = new Map();

// プリレンダリングの実行
const prerender = async (url, options = {}) => {
  try {
    // キャッシュをチェック
    if (prerenderCache.has(url) && !options.force) {
      logger.debug('Using cached prerender', { url });
      return prerenderCache.get(url);
    }

    // ブラウザインスタンスを作成
    const browser = await cef.createBrowser(url, {
      width: options.width || 1920,
      height: options.height || 1080,
      headless: true
    });

    // ページの読み込みを待機
    await waitForPageLoad(browser.id);

    // HTMLとメタデータを取得
    const content = await getPageContent(browser.id);
    const metadata = await getPageMetadata(browser.id);

    // キャッシュに保存
    const result = {
      content,
      metadata,
      timestamp: Date.now()
    };
    prerenderCache.set(url, result);

    // ブラウザを閉じる
    await cef.closeBrowser(browser.id);

    logger.info('Prerender completed', { url });
    return result;
  } catch (error) {
    logger.error('Prerender failed:', error);
    throw error;
  }
};

// ページの読み込み完了を待機
const waitForPageLoad = async (browserId) => {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve();
    }, 30000); // 30秒タイムアウト

    cef.setEventHandler(browserId, 'load', () => {
      clearTimeout(timeout);
      resolve();
    });
  });
};

// ページのコンテンツを取得
const getPageContent = async (browserId) => {
  const script = `
    document.documentElement.outerHTML;
  `;
  const result = await cef.executeScript(browserId, script);
  return result.result;
};

// ページのメタデータを取得
const getPageMetadata = async (browserId) => {
  const script = `
    {
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content,
      keywords: document.querySelector('meta[name="keywords"]')?.content,
      ogTags: Array.from(document.querySelectorAll('meta[property^="og:"]')).map(tag => ({
        property: tag.getAttribute('property'),
        content: tag.getAttribute('content')
      }))
    }
  `;
  const result = await cef.executeScript(browserId, script);
  return result.result;
};

// キャッシュの管理
const clearCache = () => {
  prerenderCache.clear();
  logger.info('Prerender cache cleared');
};

const getCacheSize = () => {
  return prerenderCache.size;
};

const getCacheStats = () => {
  const stats = {
    size: prerenderCache.size,
    urls: Array.from(prerenderCache.keys()),
    totalSize: 0
  };

  prerenderCache.forEach(entry => {
    stats.totalSize += JSON.stringify(entry).length;
  });

  return stats;
};

// キャッシュの有効期限チェック
const cleanupCache = (maxAge = 24 * 60 * 60 * 1000) => { // デフォルト24時間
  const now = Date.now();
  let cleaned = 0;

  prerenderCache.forEach((value, key) => {
    if (now - value.timestamp > maxAge) {
      prerenderCache.delete(key);
      cleaned++;
    }
  });

  logger.info('Cache cleanup completed', { cleaned });
  return cleaned;
};

module.exports = {
  prerender,
  clearCache,
  getCacheSize,
  getCacheStats,
  cleanupCache
}; 