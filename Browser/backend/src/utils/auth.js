const crypto = require('crypto');
const logger = require('./logger');
const { AuthenticationError, AuthorizationError } = require('./error-handler');

// トークンの生成
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// パスワードのハッシュ化
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
};

// パスワードの検証
const verifyPassword = (password, hash, salt) => {
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
};

// セッションの作成
const createSession = (user) => {
  const sessionId = generateToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間

  // TODO: セッションをデータベースに保存
  logger.info('Session created', {
    userId: user.id,
    sessionId,
    expiresAt
  });

  return { sessionId, expiresAt };
};

// セッションの検証
const verifySession = async (sessionId) => {
  if (!sessionId) {
    throw new AuthenticationError('セッションIDが必要です');
  }

  // TODO: セッションをデータベースから取得
  const session = {
    userId: 1,
    expiresAt: new Date(Date.now() + 1000)
  };

  if (!session) {
    throw new AuthenticationError('無効なセッション');
  }

  if (new Date(session.expiresAt) < new Date()) {
    throw new AuthenticationError('セッションの有効期限が切れています');
  }

  return session;
};

// 権限の検証
const verifyPermissions = (user, requiredPermissions) => {
  if (!user || !user.permissions) {
    throw new AuthorizationError('権限が必要です');
  }

  const hasAllPermissions = requiredPermissions.every(
    permission => user.permissions.includes(permission)
  );

  if (!hasAllPermissions) {
    throw new AuthorizationError('必要な権限がありません');
  }

  return true;
};

// APIキーの生成
const generateApiKey = () => {
  const prefix = 'bapi';
  const key = crypto.randomBytes(24).toString('base64').replace(/[+/=]/g, '');
  return `${prefix}_${key}`;
};

// APIキーの検証
const verifyApiKey = async (apiKey) => {
  if (!apiKey) {
    throw new AuthenticationError('APIキーが必要です');
  }

  // TODO: APIキーをデータベースから検証
  const isValid = apiKey.startsWith('bapi_');

  if (!isValid) {
    throw new AuthenticationError('無効なAPIキー');
  }

  return true;
};

// JWTトークンの生成
const generateJwt = (payload, expiresIn = '1h') => {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const exp = now + (typeof expiresIn === 'number' ? expiresIn : 3600);

  const data = {
    ...payload,
    iat: now,
    exp
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'secret')
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

// JWTトークンの検証
const verifyJwt = (token) => {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');

    const signature = crypto
      .createHmac('sha256', process.env.JWT_SECRET || 'secret')
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    if (signature !== signatureB64) {
      throw new AuthenticationError('無効なトークン');
    }

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new AuthenticationError('トークンの有効期限が切れています');
    }

    return payload;
  } catch (error) {
    throw new AuthenticationError('トークンの検証に失敗しました');
  }
};

module.exports = {
  generateToken,
  hashPassword,
  verifyPassword,
  createSession,
  verifySession,
  verifyPermissions,
  generateApiKey,
  verifyApiKey,
  generateJwt,
  verifyJwt
}; 