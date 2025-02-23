#!/bin/bash
set -e

# 環境変数の読み込み
source .env

# バックアップ設定
BACKUP_DIR="/var/backups/school-hub"
BACKUP_RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/school_hub_backup_$DATE.sql.gz"

# バックアップディレクトリの作成
mkdir -p "$BACKUP_DIR"

# データベースのバックアップ
echo "データベースのバックアップを開始します..."
PGPASSWORD="$DB_PASSWORD" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -F c \
  | gzip > "$BACKUP_FILE"

# バックアップファイルの権限設定
chmod 600 "$BACKUP_FILE"

# 古いバックアップの削除
find "$BACKUP_DIR" -type f -name "school_hub_backup_*.sql.gz" -mtime +$BACKUP_RETENTION_DAYS -delete

# バックアップの検証
echo "バックアップの検証を行います..."
if gzip -t "$BACKUP_FILE"; then
  echo "バックアップが正常に作成されました: $BACKUP_FILE"
else
  echo "バックアップの作成に失敗しました"
  exit 1
fi

# バックアップのメタデータを記録
echo "バックアップメタデータを記録します..."
cat << EOF > "$BACKUP_DIR/backup_metadata_$DATE.json"
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "file": "$BACKUP_FILE",
  "size": "$(du -h "$BACKUP_FILE" | cut -f1)",
  "database": "$DB_NAME",
  "version": "$(psql -V)"
}
EOF

# バックアップの暗号化（オプション）
if [ -n "$BACKUP_ENCRYPTION_KEY" ]; then
  echo "バックアップを暗号化します..."
  gpg --batch --yes --passphrase "$BACKUP_ENCRYPTION_KEY" -c "$BACKUP_FILE"
  rm "$BACKUP_FILE"
  echo "バックアップが暗号化されました: $BACKUP_FILE.gpg"
fi

# リモートストレージへのコピー（オプション）
if [ -n "$REMOTE_BACKUP_PATH" ]; then
  echo "リモートストレージにバックアップをコピーします..."
  rsync -avz --progress "$BACKUP_DIR/" "$REMOTE_BACKUP_PATH/"
fi

echo "バックアップが完了しました" 