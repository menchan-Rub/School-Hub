const { chromium } = require('playwright');
const { startServer } = require('../../server');
const path = require('path');
const os = require('os');

// テスト環境の設定
process.env.NODE_ENV = 'test';
process.env.TEST_DB_NAME = 'school_hub_browser_e2e_test';
process.env.TEST_WS_PORT = '8082';
process.env.TEST_CACHE_DIR = path.join(os.tmpdir(), 'school-hub-browser-e2e-test');

// グローバル変数
global.browser = null;
global.context = null;
global.page = null;
global.server = null;

// セットアップ
global.setup = async () => {
    // サーバーの起動
    global.server = await startServer({
        port: 3001,
        dbName: process.env.TEST_DB_NAME,
        wsPort: process.env.TEST_WS_PORT
    });

    // ブラウザの起動
    global.browser = await chromium.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=1920,1080'
        ]
    });

    // コンテキストの作成
    global.context = await global.browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'School-Hub Browser Test/1.0',
        permissions: ['geolocation', 'notifications'],
        bypassCSP: true
    });

    // ページの作成
    global.page = await global.context.newPage();

    // グローバルタイムアウトの設定
    global.page.setDefaultTimeout(10000);
    global.page.setDefaultNavigationTimeout(10000);

    // カスタムコマンドの追加
    global.page.waitForLoadState = async (state = 'networkidle') => {
        await global.page.waitForLoadState(state);
    };

    global.page.waitForResponse = async (urlOrPredicate, options = {}) => {
        return await global.page.waitForResponse(urlOrPredicate, options);
    };
};

// クリーンアップ
global.teardown = async () => {
    // ブラウザの終了
    if (global.browser) {
        await global.browser.close();
    }

    // サーバーの終了
    if (global.server) {
        await global.server.close();
    }
};

// ヘルパー関数
global.navigateToUrl = async (url) => {
    await global.page.goto(url);
    await global.page.waitForLoadState();
};

global.getElementText = async (selector) => {
    return await global.page.$eval(selector, el => el.textContent);
};

global.clickElement = async (selector) => {
    await global.page.click(selector);
};

global.typeText = async (selector, text) => {
    await global.page.fill(selector, text);
};

global.waitForElement = async (selector, options = {}) => {
    await global.page.waitForSelector(selector, options);
};

global.expectElementToExist = async (selector) => {
    const element = await global.page.$(selector);
    expect(element).not.toBeNull();
};

global.expectElementNotToExist = async (selector) => {
    const element = await global.page.$(selector);
    expect(element).toBeNull();
};

global.expectElementToHaveText = async (selector, text) => {
    const actualText = await getElementText(selector);
    expect(actualText).toBe(text);
};

global.expectUrlToBe = async (url) => {
    expect(global.page.url()).toBe(url);
};

global.takeScreenshot = async (name) => {
    await global.page.screenshot({
        path: path.join(__dirname, 'screenshots', `${name}.png`),
        fullPage: true
    });
};

// カスタムマッチャー
expect.extend({
    async toBeVisible(selector) {
        try {
            const element = await global.page.waitForSelector(selector, { state: 'visible', timeout: 5000 });
            return {
                message: () => `expected ${selector} not to be visible`,
                pass: true
            };
        } catch {
            return {
                message: () => `expected ${selector} to be visible`,
                pass: false
            };
        }
    },
    async toHaveCount(selector, count) {
        const elements = await global.page.$$(selector);
        const pass = elements.length === count;
        return {
            message: () => 
                pass
                    ? `expected ${selector} not to have count ${count}`
                    : `expected ${selector} to have count ${count} but found ${elements.length}`,
            pass
        };
    }
}); 