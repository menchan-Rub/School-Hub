# ビルドステージ
FROM node:18-alpine AS builder

WORKDIR /app

# 依存関係のインストール
COPY package*.json ./
RUN npm ci

# ソースコードのコピー
COPY . .

# TypeScriptのビルド
RUN npm run build

# 本番ステージ
FROM node:18-alpine AS runner

WORKDIR /app

# 本番用の依存関係のみをインストール
COPY package*.json ./
RUN npm ci --only=production

# ビルド済みのファイルをコピー
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# 必要なファイルのコピー
COPY scripts ./scripts
COPY .env.example ./.env.example

# 環境変数の設定
ENV NODE_ENV=production
ENV PORT=3000

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

# アプリケーションの起動
EXPOSE ${PORT}
CMD ["npm", "start"] 