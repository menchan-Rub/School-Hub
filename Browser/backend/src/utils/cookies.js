const logger = require('./logger');

// クッキーストアの管理
let cookieStore = new Map();

// クッキーの設定
const setCookie = async (domain, cookie) => {
  try {
    const domainCookies = cookieStore.get(domain) || new Map();
    
    // クッキーの検証
    validateCookie(cookie);

    // クッキーの有効期限を設定
    const expires = cookie.expires ? new Date(cookie.expires) : null;
    if (expires && expires < new Date()) {
      // 有効期限切れの場合は削除
      domainCookies.delete(cookie.name);
    } else {
      // クッキーを保存
      domainCookies.set(cookie.name, {
        value: cookie.value,
        domain: cookie.domain || domain,
        path: cookie.path || '/',
        expires,
        httpOnly: cookie.httpOnly || false,
        secure: cookie.secure || false,
        sameSite: cookie.sameSite || 'Lax'
      });
    }

    cookieStore.set(domain, domainCookies);
    logger.debug('Cookie set', { domain, cookie });

    return true;
  } catch (error) {
    logger.error('Failed to set cookie:', error);
    throw error;
  }
};

// クッキーの取得
const getCookie = (domain, name) => {
  try {
    const domainCookies = cookieStore.get(domain);
    if (!domainCookies) {
      return null;
    }

    const cookie = domainCookies.get(name);
    if (!cookie || (cookie.expires && cookie.expires < new Date())) {
      return null;
    }

    return cookie;
  } catch (error) {
    logger.error('Failed to get cookie:', error);
    throw error;
  }
};

// ドメインのすべてのクッキーを取得
const getAllCookies = (domain) => {
  try {
    const domainCookies = cookieStore.get(domain);
    if (!domainCookies) {
      return [];
    }

    // 有効期限切れのクッキーを除外
    const now = new Date();
    const validCookies = Array.from(domainCookies.entries())
      .filter(([_, cookie]) => !cookie.expires || cookie.expires > now)
      .map(([name, cookie]) => ({ name, ...cookie }));

    return validCookies;
  } catch (error) {
    logger.error('Failed to get all cookies:', error);
    throw error;
  }
};

// クッキーの削除
const deleteCookie = (domain, name) => {
  try {
    const domainCookies = cookieStore.get(domain);
    if (!domainCookies) {
      return false;
    }

    const result = domainCookies.delete(name);
    if (domainCookies.size === 0) {
      cookieStore.delete(domain);
    }

    logger.debug('Cookie deleted', { domain, name });
    return result;
  } catch (error) {
    logger.error('Failed to delete cookie:', error);
    throw error;
  }
};

// ドメインのすべてのクッキーを削除
const clearCookies = (domain) => {
  try {
    const result = cookieStore.delete(domain);
    logger.debug('Cookies cleared', { domain });
    return result;
  } catch (error) {
    logger.error('Failed to clear cookies:', error);
    throw error;
  }
};

// クッキーの検証
const validateCookie = (cookie) => {
  if (!cookie.name || !cookie.value) {
    throw new Error('Cookie must have name and value');
  }

  if (cookie.name.includes(';') || cookie.name.includes('=')) {
    throw new Error('Cookie name cannot contain ; or =');
  }

  if (cookie.expires && isNaN(new Date(cookie.expires).getTime())) {
    throw new Error('Invalid cookie expiration date');
  }

  if (cookie.sameSite && !['Strict', 'Lax', 'None'].includes(cookie.sameSite)) {
    throw new Error('Invalid sameSite value');
  }

  if (cookie.sameSite === 'None' && !cookie.secure) {
    throw new Error('Cookies with SameSite=None must be Secure');
  }
};

// クッキー文字列のパース
const parseCookieString = (cookieString) => {
  try {
    const cookies = new Map();
    const pairs = cookieString.split(';');

    for (const pair of pairs) {
      const [name, value] = pair.trim().split('=');
      cookies.set(name, decodeURIComponent(value));
    }

    return cookies;
  } catch (error) {
    logger.error('Failed to parse cookie string:', error);
    throw error;
  }
};

// クッキー文字列の生成
const generateCookieString = (cookie) => {
  try {
    let parts = [`${cookie.name}=${encodeURIComponent(cookie.value)}`];

    if (cookie.domain) {
      parts.push(`Domain=${cookie.domain}`);
    }

    if (cookie.path) {
      parts.push(`Path=${cookie.path}`);
    }

    if (cookie.expires) {
      parts.push(`Expires=${cookie.expires.toUTCString()}`);
    }

    if (cookie.maxAge) {
      parts.push(`Max-Age=${cookie.maxAge}`);
    }

    if (cookie.secure) {
      parts.push('Secure');
    }

    if (cookie.httpOnly) {
      parts.push('HttpOnly');
    }

    if (cookie.sameSite) {
      parts.push(`SameSite=${cookie.sameSite}`);
    }

    return parts.join('; ');
  } catch (error) {
    logger.error('Failed to generate cookie string:', error);
    throw error;
  }
};

module.exports = {
  setCookie,
  getCookie,
  getAllCookies,
  deleteCookie,
  clearCookies,
  validateCookie,
  parseCookieString,
  generateCookieString
}; 