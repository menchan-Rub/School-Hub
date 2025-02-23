#!/bin/bash

# エラーハンドリング
set -e

# 環境変数の読み込み
if [ -f .env ]; then
    source .env
fi

# 必要な環境変数のチェック
required_vars=(
    "DB_HOST"
    "DB_PORT"
    "DB_USER"
    "DB_PASSWORD"
    "DB_NAME"
    "WS_PORT"
    "SAFE_BROWSING_API_KEY"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: $var is not set"
        exit 1
    fi
done

# バージョン情報の更新
VERSION=$(node -p "require('./package.json').version")
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEPLOY_DIR="dist_${VERSION}_${TIMESTAMP}"

echo "Deploying version $VERSION..."

# ビルドディレクトリのクリーンアップ
rm -rf dist
rm -rf $DEPLOY_DIR

# 依存関係のインストール
echo "Installing dependencies..."
npm ci

# TypeScriptのビルド
echo "Building TypeScript..."
npm run build

# テストの実行
echo "Running tests..."
npm run test
npm run test:e2e

# 本番用ビルド
echo "Creating production build..."
mkdir -p $DEPLOY_DIR
cp -r dist/* $DEPLOY_DIR/
cp package.json $DEPLOY_DIR/
cp package-lock.json $DEPLOY_DIR/
cp .env.example $DEPLOY_DIR/
cp README.md $DEPLOY_DIR/
cp LICENSE $DEPLOY_DIR/

# 本番用の設定ファイル
echo "Configuring production settings..."
cat > $DEPLOY_DIR/config.js << EOL
module.exports = {
    db: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    },
    ws: {
        port: process.env.WS_PORT
    },
    security: {
        safeBrowsingApiKey: process.env.SAFE_BROWSING_API_KEY
    },
    cache: {
        enabled: true,
        size: 100 * 1024 * 1024 // 100MB
    },
    performance: {
        maxTabs: 50,
        maxMemoryUsage: 1024 * 1024 * 1024 // 1GB
    }
};
EOL

# データベースのマイグレーション
echo "Running database migrations..."
NODE_ENV=production node $DEPLOY_DIR/database/migrations/index.js

# サービスの再起動
if [ -f /etc/systemd/system/school-hub-browser.service ]; then
    echo "Restarting service..."
    sudo systemctl restart school-hub-browser
else
    # サービスファイルの作成
    echo "Creating service file..."
    cat > /tmp/school-hub-browser.service << EOL
[Unit]
Description=School Hub Browser
After=network.target postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)/$DEPLOY_DIR
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOL

    sudo mv /tmp/school-hub-browser.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable school-hub-browser
    sudo systemctl start school-hub-browser
fi

# Nginxの設定
if [ ! -f /etc/nginx/sites-available/school-hub-browser ]; then
    echo "Configuring Nginx..."
    cat > /tmp/school-hub-browser << EOL
server {
    listen 80;
    server_name browser.school-hub.local;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /ws {
        proxy_pass http://localhost:\$WS_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host \$host;
    }
}
EOL

    sudo mv /tmp/school-hub-browser /etc/nginx/sites-available/
    sudo ln -s /etc/nginx/sites-available/school-hub-browser /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl restart nginx
fi

# デプロイ完了の通知
echo "Deployment completed successfully!"
echo "Version: $VERSION"
echo "Timestamp: $TIMESTAMP"
echo "Directory: $DEPLOY_DIR"

# ヘルスチェック
echo "Running health check..."
for i in {1..5}; do
    if curl -s http://localhost:3000/health > /dev/null; then
        echo "Health check passed!"
        exit 0
    fi
    echo "Waiting for service to start... ($i/5)"
    sleep 5
done

echo "Warning: Health check failed after 5 attempts"
exit 1 