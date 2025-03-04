#!/bin/bash

# School-Hub用ブラウザサーバー起動スクリプト
# このスクリプトは、デフォルトブラウザとTriumブラウザの両方のサーバーを起動します

# 作業ディレクトリをプロジェクトルートに設定
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)

# ログディレクトリを作成
mkdir -p logs

# 関数: プロセスが実行中かどうかを確認
is_process_running() {
  local port=$1
  netstat -tuln | grep ":$port " > /dev/null
  return $?
}

# 関数: ブラウザフロントエンドを起動
start_browser_frontend() {
  echo "ブラウザフロントエンドを起動しています..."
  cd "$PROJECT_ROOT/Browser/frontend"
  
  # すでに実行中かどうかを確認
  if is_process_running 3001; then
    echo "ブラウザフロントエンドはすでに実行中です (ポート 3001)"
  else
    # バックグラウンドで起動
    npm start > "$PROJECT_ROOT/logs/browser_frontend.log" 2>&1 &
    echo "ブラウザフロントエンドを起動しました (PID: $!)"
  fi
}

# 関数: デフォルトブラウザバックエンドを起動
start_default_browser_backend() {
  echo "デフォルトブラウザバックエンドを起動しています..."
  cd "$PROJECT_ROOT/Browser/backend"
  
  # すでに実行中かどうかを確認
  if is_process_running 10284; then
    echo "デフォルトブラウザバックエンドはすでに実行中です (ポート 10284)"
  else
    # バックグラウンドで起動
    python app.py > "$PROJECT_ROOT/logs/default_browser_backend.log" 2>&1 &
    echo "デフォルトブラウザバックエンドを起動しました (PID: $!)"
  fi
}

# 関数: Triumブラウザバックエンドを起動
start_trium_browser_backend() {
  echo "Triumブラウザバックエンドを起動しています..."
  cd "$PROJECT_ROOT/Browser/backend"
  
  # すでに実行中かどうかを確認
  if is_process_running 10285; then
    echo "Triumブラウザバックエンドはすでに実行中です (ポート 10285)"
  else
    # 依存関係をインストール
    pip install -r requirements.txt > /dev/null 2>&1
    
    # バックグラウンドで起動
    python trium_server.py > "$PROJECT_ROOT/logs/trium_browser_backend.log" 2>&1 &
    echo "Triumブラウザバックエンドを起動しました (PID: $!)"
  fi
}

# メイン処理
echo "School-Hubブラウザサーバーを起動しています..."

# フロントエンドを起動
start_browser_frontend

# デフォルトブラウザバックエンドを起動
start_default_browser_backend

# Triumブラウザバックエンドを起動
start_trium_browser_backend

echo "すべてのブラウザサーバーが起動しました。"
echo "ログは logs/ ディレクトリに保存されています。" 