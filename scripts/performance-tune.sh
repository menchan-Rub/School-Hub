#!/bin/bash
set -e

# 環境変数の読み込み
source .env

# Node.jsのパフォーマンスチューニング
tune_nodejs() {
    echo "Node.jsのパフォーマンスチューニングを開始します..."
    
    # メモリ制限の設定
    export NODE_OPTIONS="--max-old-space-size=4096"
    
    # GCパラメータの最適化
    export NODE_OPTIONS="$NODE_OPTIONS --optimize-for-size --max-semi-space-size=64"
    
    # V8の最適化
    export NODE_OPTIONS="$NODE_OPTIONS --use-strict --no-lazy"
    
    echo "Node.jsのパフォーマンスチューニングが完了しました"
}

# Postgresのパフォーマンスチューニング
tune_postgres() {
    echo "Postgresのパフォーマンスチューニングを開始します..."
    
    # 設定ファイルのバックアップ
    cp /etc/postgresql/14/main/postgresql.conf /etc/postgresql/14/main/postgresql.conf.bak
    
    # メモリ関連の設定
    cat << EOF >> /etc/postgresql/14/main/postgresql.conf
# メモリ設定
shared_buffers = '1GB'                  # システムメモリの25%
effective_cache_size = '3GB'            # システムメモリの75%
work_mem = '32MB'                       # クエリごとのメモリ
maintenance_work_mem = '256MB'          # メンテナンス操作用のメモリ

# クエリプランナーの設定
random_page_cost = 1.1                  # SSDの場合
effective_io_concurrency = 200          # SSDの場合
default_statistics_target = 100         # 統計情報の詳細度

# WAL設定
wal_buffers = '16MB'                    # WALバッファサイズ
checkpoint_completion_target = 0.9       # チェックポイントの完了目標時間
max_wal_size = '1GB'                    # 最大WALサイズ
min_wal_size = '80MB'                   # 最小WALサイズ

# 並列処理の設定
max_worker_processes = 8                # 最大ワーカープロセス数
max_parallel_workers_per_gather = 4     # クエリごとの並列ワーカー数
max_parallel_workers = 8                # 最大並列ワーカー数
max_parallel_maintenance_workers = 4     # メンテナンス時の並列ワーカー数

# 接続設定
max_connections = 100                   # 最大接続数
EOF
    
    # Postgresの再起動
    systemctl restart postgresql
    
    echo "Postgresのパフォーマンスチューニングが完了しました"
}

# Nginxのパフォーマンスチューニング
tune_nginx() {
    echo "Nginxのパフォーマンスチューニングを開始します..."
    
    # 設定ファイルのバックアップ
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak
    
    # 最適化された設定の適用
    cat << EOF > /etc/nginx/nginx.conf
user www-data;
worker_processes auto;
worker_rlimit_nofile 100000;
pid /run/nginx.pid;

events {
    worker_connections 4096;
    multi_accept on;
    use epoll;
}

http {
    # 基本設定
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    # バッファサイズの設定
    client_body_buffer_size 128k;
    client_max_body_size 50m;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 32k;

    # タイムアウト設定
    client_body_timeout 60s;
    client_header_timeout 60s;
    send_timeout 60s;

    # ファイルキャッシュ設定
    open_file_cache max=200000 inactive=20s;
    open_file_cache_valid 30s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;

    # Gzip設定
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_buffers 16 8k;
    gzip_http_version 1.1;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    include /etc/nginx/conf.d/*.conf;
}
EOF
    
    # Nginxの再起動
    systemctl restart nginx
    
    echo "Nginxのパフォーマンスチューニングが完了しました"
}

# システムのパフォーマンスチューニング
tune_system() {
    echo "システムのパフォーマンスチューニングを開始します..."
    
    # カーネルパラメータの最適化
    cat << EOF > /etc/sysctl.d/99-performance.conf
# ネットワークチューニング
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_keepalive_probes = 5
net.ipv4.tcp_keepalive_intvl = 15

# ファイルシステムチューニング
fs.file-max = 2097152
fs.inotify.max_user_watches = 524288

# メモリチューニング
vm.swappiness = 10
vm.dirty_ratio = 60
vm.dirty_background_ratio = 2
EOF
    
    # カーネルパラメータの適用
    sysctl -p /etc/sysctl.d/99-performance.conf
    
    # システムリソース制限の設定
    cat << EOF > /etc/security/limits.d/99-performance.conf
* soft nofile 1048576
* hard nofile 1048576
* soft nproc 32768
* hard nproc 32768
EOF
    
    echo "システムのパフォーマンスチューニングが完了しました"
}

# メイン処理
main() {
    echo "パフォーマンスチューニングを開始します..."
    
    # 各コンポーネントのチューニング
    tune_nodejs
    tune_postgres
    tune_nginx
    tune_system
    
    echo "パフォーマンスチューニングが完了しました"
    echo "システムの再起動を推奨します"
}

# スクリプトの実行
main 