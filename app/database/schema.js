// ブラウザ履歴用のスキーマと設定用のスキーマを削除

// ブラウザ履歴用のスキーマ
const browserHistorySchema = {
  userId: String,        // ユーザーID
  url: String,          // アクセスしたURL
  title: String,        // ページタイトル
  timestamp: Date,      // アクセス日時
  deviceInfo: {         // デバイス情報
    browser: String,
    os: String,
    ip: String
  },
  status: String        // 'active' または 'deleted'
};

// ブラウザ設定用のスキーマ
const browserSettingsSchema = {
  userId: String,
  theme: String,        // 'light' または 'dark'
  searchEngine: String, // デフォルト検索エンジン
  startPage: String,    // スタートページURL
  lastUpdated: Date
};

// データベーススキーマ定義
// 必要に応じて他のスキーマを追加してください 