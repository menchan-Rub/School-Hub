const jwt = require('jsonwebtoken');

// 通常の認証ミドルウェア
const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: '認証が必要です' });
  }
};

// 管理者用の認証ミドルウェア
auth.admin = (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) {
      throw new Error();
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: '管理者権限が必要です' });
  }
};

module.exports = auth; 