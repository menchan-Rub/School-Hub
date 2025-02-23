const { jest } = require('@jest/globals');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

// テスト環境の設定
process.env.NODE_ENV = 'test';
process.env.TEST_DB_NAME = 'school_hub_browser_test';
process.env.TEST_WS_PORT = '8081';
process.env.TEST_CACHE_DIR = path.join(os.tmpdir(), 'school-hub-browser-test');

// グローバルセットアップ
global.beforeAll(async () => {
    // テスト用ディレクトリの作成
    await fs.mkdir(process.env.TEST_CACHE_DIR, { recursive: true });

    // テストデータベースの準備
    const { Client } = require('pg');
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres'
    });

    try {
        await client.connect();
        await client.query(`DROP DATABASE IF EXISTS ${process.env.TEST_DB_NAME}`);
        await client.query(`CREATE DATABASE ${process.env.TEST_DB_NAME}`);
    } finally {
        await client.end();
    }

    // マイグレーションの実行
    const { migrate } = require('../database/migrations');
    await migrate();
});

// グローバルクリーンアップ
global.afterAll(async () => {
    // テストディレクトリの削除
    await fs.rm(process.env.TEST_CACHE_DIR, { recursive: true, force: true });

    // テストデータベースの削除
    const { Client } = require('pg');
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres'
    });

    try {
        await client.connect();
        await client.query(`DROP DATABASE IF EXISTS ${process.env.TEST_DB_NAME}`);
    } finally {
        await client.end();
    }
});

// モックの設定
jest.mock('cef-node', () => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    createBrowser: jest.fn().mockResolvedValue({
        loadUrl: jest.fn().mockResolvedValue(undefined),
        executeJavaScript: jest.fn().mockResolvedValue(undefined),
        captureScreenshot: jest.fn().mockResolvedValue(Buffer.from('test')),
        on: jest.fn()
    }),
    WindowInfo: jest.fn().mockImplementation(() => ({
        SetAsWindowless: jest.fn()
    })),
    LOG_SEVERITY_WARNING: 2,
    shutdown: jest.fn().mockResolvedValue(undefined),
    purgeMemory: jest.fn()
}));

jest.mock('safe-browsing', () => ({
    init: jest.fn().mockResolvedValue({
        checkUrl: jest.fn().mockResolvedValue([])
    })
}));

// ヘルパー関数
global.createTestBrowser = async () => {
    const BrowserEngine = require('../browser/core/engine/browser-engine');
    const engine = new BrowserEngine();
    await engine.initialize();
    return engine;
};

global.createTestClient = async () => {
    const WebSocket = require('ws');
    const ws = new WebSocket(`ws://localhost:${process.env.TEST_WS_PORT}`);
    return new Promise((resolve, reject) => {
        ws.on('open', () => resolve(ws));
        ws.on('error', reject);
    });
};

// カスタムマッチャー
expect.extend({
    toBeValidUrl(received) {
        try {
            new URL(received);
            return {
                message: () => `expected ${received} not to be a valid URL`,
                pass: true
            };
        } catch {
            return {
                message: () => `expected ${received} to be a valid URL`,
                pass: false
            };
        }
    },
    toBeValidVersion(received) {
        const versionRegex = /^\d+\.\d+\.\d+$/;
        const pass = versionRegex.test(received);
        return {
            message: () => 
                pass
                    ? `expected ${received} not to be a valid version number`
                    : `expected ${received} to be a valid version number`,
            pass
        };
    }
}); 