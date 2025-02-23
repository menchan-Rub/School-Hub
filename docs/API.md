# School-Hub API ドキュメント

## 認証
すべてのAPIリクエストには認証が必要です。NextAuth.jsを使用して認証を行います。

### エンドポイント

#### ブラウザ監視 API

##### メトリクス取得
```http
GET /api/admin/browser/metrics
```

**レスポンス**
```json
{
  "timestamp": 1234567890,
  "memory": {
    "process": {
      "heapUsed": {
        "value": 100,
        "unit": "MB"
      }
    },
    "system": {
      "used": {
        "value": 1000,
        "unit": "MB"
      }
    }
  },
  "cpu": {
    "loadAverage": {
      "1min": 0.5
    }
  }
}
```

##### セキュリティアラート取得
```http
GET /api/admin/browser/alerts
```

**レスポンス**
```json
[
  {
    "type": "warning",
    "message": "不審なアクセスを検出しました",
    "timestamp": 1234567890
  }
]
```

##### 統計情報取得
```http
GET /api/admin/browser/stats
```

**レスポンス**
```json
{
  "activeUsers": 100,
  "totalTabs": 500,
  "popularDomains": [
    {
      "domain": "example.com",
      "visits": 1000
    }
  ]
}
```

##### パフォーマンス最適化
```http
POST /api/admin/browser/optimize
```

**レスポンス**
```json
{
  "success": true,
  "metrics": {
    "memory": {
      "before": 1000,
      "after": 800,
      "unit": "MB"
    },
    "cpu": {
      "before": 0.8,
      "after": 0.5
    }
  }
}
```

### エラーレスポンス

#### 認証エラー
```json
{
  "error": "Unauthorized",
  "status": 401
}
```

#### サーバーエラー
```json
{
  "error": "Internal Error",
  "status": 500
}
```

## データモデル

### BrowserSession
```typescript
interface BrowserSession {
  id: string;
  userId: string;
  startTime: Date;
  lastActivity: Date;
  userAgent: string;
  tabs: BrowserTab[];
}
```

### BrowserTab
```typescript
interface BrowserTab {
  id: string;
  sessionId: string;
  url: string;
  title: string;
  favicon?: string;
  closed: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### BrowserSecurityAlert
```typescript
interface BrowserSecurityAlert {
  id: string;
  severity: 'warning' | 'error';
  message: string;
  details?: any;
  createdAt: Date;
}
```

### BrowserPerformanceMetric
```typescript
interface BrowserPerformanceMetric {
  id: string;
  timestamp: Date;
  metrics: {
    memory: {
      process: {
        heapUsed: number;
      };
      system: {
        used: number;
      };
    };
    cpu: {
      loadAverage: {
        '1min': number;
      };
    };
  };
  type: 'memory' | 'cpu' | 'network';
}
```

## レート制限
- 認証済みユーザー: 1000リクエスト/時
- 管理者: 5000リクエスト/時

## キャッシュ
- メトリクスデータ: 1分
- セキュリティアラート: 30秒
- 統計情報: 1分

## バージョニング
APIのバージョニングは、URLパスで管理します：
- 現在のバージョン: v1
- 例: `/api/v1/admin/browser/metrics` 