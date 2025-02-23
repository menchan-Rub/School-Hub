// 設定のモック
const config = {
  database: {
    host: 'localhost',
    port: 5432,
    user: 'test',
    password: 'test',
    database: 'test'
  },
  websocket: {
    maxPayload: 1024 * 1024, // 1MB
    path: '/ws'
  },
  monitoring: {
    enabled: true,
    interval: 60000,
    retention: 7 * 24 * 60 * 60 * 1000,
    alerts: {
      enabled: true,
      channels: ['log', 'email']
    }
  }
};

module.exports = config; 