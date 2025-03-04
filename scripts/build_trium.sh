#!/bin/bash

# Triumブラウザのビルドスクリプト
# このスクリプトはChromiumをソースコードからビルドし、School-Hubと統合します

set -e

# 作業ディレクトリをプロジェクトルートに設定
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)

# 必要なディレクトリを作成
mkdir -p Browser/bin
mkdir -p Browser/logs
mkdir -p Browser/depot_tools

echo "===== Triumブラウザのビルドを開始します ====="

# 必要なツールがインストールされているか確認
command -v git >/dev/null 2>&1 || { echo "エラー: gitがインストールされていません。"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "エラー: python3がインストールされていません。"; exit 1; }
command -v pip3 >/dev/null 2>&1 || { echo "エラー: pip3がインストールされていません。"; exit 1; }

# バックエンド依存関係をインストール
echo "バックエンド依存関係をインストールしています..."
pip3 install websockets requests

# ビルドに必要なパッケージをインストール
echo "ビルドに必要なパッケージをインストールしています..."
if [ -f /etc/debian_version ]; then
  # Debian/Ubuntuの場合
  sudo apt-get update
  sudo apt-get install -y \
    git \
    python3 \
    python3-pip \
    ninja-build \
    pkg-config \
    gcc \
    g++ \
    curl \
    libpulse-dev \
    libglib2.0-dev \
    libgtk-3-dev \
    libdbus-1-dev \
    libatk1.0-dev \
    libatk-bridge2.0-dev \
    libcups2-dev \
    libdrm-dev \
    libasound2-dev \
    libxkbcommon-dev \
    libxcomposite-dev \
    libxdamage-dev \
    libxrandr-dev \
    libgbm-dev \
    libpango1.0-dev \
    libcairo2-dev \
    libnss3-dev \
    libxss-dev \
    libfontconfig1-dev
fi

# depot_toolsをダウンロード
echo "depot_toolsをダウンロードしています..."
if [ ! -d "Browser/depot_tools/.git" ]; then
  git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git Browser/depot_tools
fi

# depot_toolsをPATHに追加
export PATH="${PROJECT_ROOT}/Browser/depot_tools:$PATH"
echo "depot_toolsをPATHに追加しました: ${PROJECT_ROOT}/Browser/depot_tools"

# 一時ビルドディレクトリを作成
BUILD_DIR=$(mktemp -d)
cd "$BUILD_DIR"

echo "Chromiumのソースコードを取得しています..."
# gclientの設定
cat > .gclient << EOF
solutions = [
  {
    "url": "https://chromium.googlesource.com/chromium/src.git",
    "managed": False,
    "name": "src",
    "deps_file": "DEPS",
    "custom_deps": {},
  },
]
EOF

# Chromiumのソースコードを取得
echo "Chromiumのソースコードをダウンロードしています（これには時間がかかります）..."
gclient sync

cd src

# ビルド設定
echo "ビルド設定を構成しています..."
mkdir -p out/Release
cat > out/Release/args.gn << EOF
is_debug = false
is_component_build = false
is_official_build = true
use_jumbo_build = true
enable_nacl = false
symbol_level = 0
blink_symbol_level = 0
v8_symbol_level = 0
chrome_pgo_phase = 0
enable_linux_installer = false
use_system_libjpeg = true
use_custom_libcxx = false
use_sysroot = true
use_gold = true
EOF

# gn設定を生成
gn gen out/Release

# ビルド実行（CPUコア数に基づいてジョブ数を設定）
echo "Chromiumをビルドしています（これには数時間かかる場合があります）..."
JOBS=$(nproc)
autoninja -C out/Release chrome -j"$JOBS"

# ビルドされたバイナリをコピー
echo "バイナリをコピーしています..."
cp out/Release/chrome "${PROJECT_ROOT}/Browser/bin/thorium"
chmod +x "${PROJECT_ROOT}/Browser/bin/thorium"

# 一時ディレクトリを削除
cd "$PROJECT_ROOT"
rm -rf "$BUILD_DIR"

# フロントエンドのビルド
echo "フロントエンドをビルドしています..."
cd "${PROJECT_ROOT}/Browser/frontend"
npm install --legacy-peer-deps
npm run build

echo "===== Triumブラウザのビルドが完了しました ====="
echo "バイナリの場所: ${PROJECT_ROOT}/Browser/bin/thorium"
echo ""
echo "Triumブラウザのビルドが完了しました。以下のコマンドで起動できます："
echo "npm run start:trium"
echo ""
echo "depot_toolsを使用するには、以下のコマンドを実行してください："
echo "export PATH=\"${PROJECT_ROOT}/Browser/depot_tools:\$PATH\""

exit 0 