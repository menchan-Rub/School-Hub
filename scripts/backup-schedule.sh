#!/bin/bash
set -e

# 環境変数の読み込み
source .env

# バックアップ設定
BACKUP_ROOT="/var/backups/school-hub"
BACKUP_TYPES=(
    "database"
    "uploads"
    "logs"
)
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)

# バックアップディレクトリの作成
for type in "${BACKUP_TYPES[@]}"; do
    mkdir -p "$BACKUP_ROOT/$type"
done

# データベースのバックアップ
backup_database() {
    echo "データベースのバックアップを開始します..."
    local BACKUP_FILE="$BACKUP_ROOT/database/school_hub_db_$DATE.sql.gz"
    
    PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -F c \
        | gzip > "$BACKUP_FILE"
    
    # バックアップの検証
    if gzip -t "$BACKUP_FILE"; then
        echo "データベースのバックアップが完了しました: $BACKUP_FILE"
    else
        echo "データベースのバックアップに失敗しました"
        exit 1
    fi
}

# アップロードファイルのバックアップ
backup_uploads() {
    echo "アップロードファイルのバックアップを開始します..."
    local BACKUP_FILE="$BACKUP_ROOT/uploads/uploads_$DATE.tar.gz"
    
    tar -czf "$BACKUP_FILE" -C /app/uploads .
    
    if [ $? -eq 0 ]; then
        echo "アップロードファイルのバックアップが完了しました: $BACKUP_FILE"
    else
        echo "アップロードファイルのバックアップに失敗しました"
        exit 1
    fi
}

# ログファイルのバックアップ
backup_logs() {
    echo "ログファイルのバックアップを開始します..."
    local BACKUP_FILE="$BACKUP_ROOT/logs/logs_$DATE.tar.gz"
    
    tar -czf "$BACKUP_FILE" -C /app/logs .
    
    if [ $? -eq 0 ]; then
        echo "ログファイルのバックアップが完了しました: $BACKUP_FILE"
    else
        echo "ログファイルのバックアップに失敗しました"
        exit 1
    fi
}

# バックアップの暗号化
encrypt_backup() {
    local file="$1"
    if [ -n "$BACKUP_ENCRYPTION_KEY" ]; then
        echo "バックアップを暗号化します: $file"
        gpg --batch --yes --passphrase "$BACKUP_ENCRYPTION_KEY" -c "$file"
        rm "$file"
        echo "バックアップが暗号化されました: $file.gpg"
    fi
}

# リモートストレージへのコピー
sync_to_remote() {
    if [ -n "$REMOTE_BACKUP_PATH" ]; then
        echo "リモートストレージにバックアップをコピーします..."
        rsync -avz --progress "$BACKUP_ROOT/" "$REMOTE_BACKUP_PATH/"
        
        if [ $? -eq 0 ]; then
            echo "リモートストレージへのコピーが完了しました"
        else
            echo "リモートストレージへのコピーに失敗しました"
            exit 1
        fi
    fi
}

# 古いバックアップの削除
cleanup_old_backups() {
    echo "古いバックアップを削除します..."
    for type in "${BACKUP_TYPES[@]}"; do
        find "$BACKUP_ROOT/$type" -type f -mtime +$RETENTION_DAYS -delete
    done
}

# メタデータの記録
record_metadata() {
    local METADATA_FILE="$BACKUP_ROOT/backup_metadata_$DATE.json"
    cat << EOF > "$METADATA_FILE"
{
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "types": $(printf '%s\n' "${BACKUP_TYPES[@]}" | jq -R . | jq -s .),
    "database": {
        "name": "$DB_NAME",
        "version": "$(psql -V)"
    },
    "retention_days": $RETENTION_DAYS,
    "encrypted": $([ -n "$BACKUP_ENCRYPTION_KEY" ] && echo "true" || echo "false"),
    "remote_sync": $([ -n "$REMOTE_BACKUP_PATH" ] && echo "true" || echo "false")
}
EOF
}

# メイン処理
main() {
    echo "バックアップを開始します..."
    
    # 各タイプのバックアップを実行
    backup_database
    backup_uploads
    backup_logs
    
    # 各バックアップファイルの暗号化
    if [ -n "$BACKUP_ENCRYPTION_KEY" ]; then
        for type in "${BACKUP_TYPES[@]}"; do
            find "$BACKUP_ROOT/$type" -type f -name "*_$DATE.*" -exec bash -c 'encrypt_backup "$0"' {} \;
        done
    fi
    
    # リモートストレージへの同期
    sync_to_remote
    
    # 古いバックアップの削除
    cleanup_old_backups
    
    # メタデータの記録
    record_metadata
    
    echo "バックアップが完了しました"
}

# スクリプトの実行
main 