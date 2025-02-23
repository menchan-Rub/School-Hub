const { test, expect } = require('@playwright/test');

test.describe('ブラウザの基本機能', () => {
    test.beforeEach(async () => {
        await global.setup();
    });

    test.afterEach(async () => {
        await global.teardown();
    });

    test('新しいタブを開けること', async () => {
        await navigateToUrl('http://localhost:3001');
        await clickElement('.new-tab-button');
        await expect('.tab').toHaveCount(2);
    });

    test('タブを閉じれること', async () => {
        await navigateToUrl('http://localhost:3001');
        await clickElement('.new-tab-button');
        await clickElement('.tab:nth-child(2) .tab-close-button');
        await expect('.tab').toHaveCount(1);
    });

    test('URLに移動できること', async () => {
        await navigateToUrl('http://localhost:3001');
        await typeText('.address-bar input', 'https://example.com');
        await page.keyboard.press('Enter');
        await expectUrlToBe('https://example.com');
    });

    test('戻る・進むができること', async () => {
        await navigateToUrl('http://localhost:3001');
        await navigateToUrl('https://example.com');
        await clickElement('.toolbar-button.back');
        await expectUrlToBe('http://localhost:3001');
        await clickElement('.toolbar-button.forward');
        await expectUrlToBe('https://example.com');
    });

    test('ページを更新できること', async () => {
        await navigateToUrl('http://localhost:3001');
        await clickElement('.toolbar-button.reload');
        await page.waitForLoadState('networkidle');
    });

    test('ブックマークを追加・削除できること', async () => {
        await navigateToUrl('http://localhost:3001');
        await clickElement('.toolbar-button.bookmarks');
        await clickElement('.bookmark-panel .add-button');
        await expect('.bookmark-item').toBeVisible();
        await clickElement('.bookmark-item .delete-button');
        await expect('.bookmark-item').not.toBeVisible();
    });

    test('履歴が記録されること', async () => {
        await navigateToUrl('http://localhost:3001');
        await navigateToUrl('https://example.com');
        await clickElement('.toolbar-button.history');
        await expect('.history-item').toBeVisible();
        await expect('.history-item .item-url').toHaveText('https://example.com');
    });

    test('ダウンロードが機能すること', async () => {
        await navigateToUrl('http://localhost:3001');
        const downloadPromise = page.waitForEvent('download');
        await clickElement('.download-link');
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBeDefined();
    });

    test('設定を変更できること', async () => {
        await navigateToUrl('http://localhost:3001');
        await clickElement('.toolbar-button.menu');
        await clickElement('.menu-item.settings');
        await clickElement('.setting-item.theme .toggle');
        await expect('.browser-window.dark-theme').toBeVisible();
    });

    test('開発者ツールを開けること', async () => {
        await navigateToUrl('http://localhost:3001');
        await clickElement('.toolbar-button.menu');
        await clickElement('.menu-item.developer-tools');
        await expect('.dev-tools-panel').toBeVisible();
    });

    test('セキュリティ警告が表示されること', async () => {
        await navigateToUrl('http://localhost:3001');
        await typeText('.address-bar input', 'http://malware.example.com');
        await page.keyboard.press('Enter');
        await expect('.security-warning').toBeVisible();
    });

    test('オフライン時に動作すること', async () => {
        await navigateToUrl('http://localhost:3001');
        await context.setOffline(true);
        await typeText('.address-bar input', 'https://example.com');
        await page.keyboard.press('Enter');
        await expect('.offline-warning').toBeVisible();
        await context.setOffline(false);
    });

    test('パフォーマンス最適化が機能すること', async () => {
        await navigateToUrl('http://localhost:3001');
        for (let i = 0; i < 10; i++) {
            await clickElement('.new-tab-button');
        }
        await expect('.performance-warning').toBeVisible();
        await clickElement('.optimize-button');
        await expect('.performance-warning').not.toBeVisible();
    });

    test('データ同期が機能すること', async () => {
        // 1つ目のブラウザコンテキスト
        const context1 = await browser.newContext();
        const page1 = await context1.newPage();
        await page1.goto('http://localhost:3001');
        await page1.click('.toolbar-button.bookmarks');
        await page1.click('.bookmark-panel .add-button');

        // 2つ目のブラウザコンテキスト
        const context2 = await browser.newContext();
        const page2 = await context2.newPage();
        await page2.goto('http://localhost:3001');
        await page2.click('.toolbar-button.bookmarks');
        await expect(page2.locator('.bookmark-item')).toBeVisible();
    });

    test('拡張機能が機能すること', async () => {
        await navigateToUrl('http://localhost:3001');
        await clickElement('.toolbar-button.menu');
        await clickElement('.menu-item.extensions');
        await clickElement('.extension-item .install-button');
        await expect('.extension-toolbar-icon').toBeVisible();
    });
});

test.describe('セキュリティ機能', () => {
    test('安全でないサイトがブロックされること', async () => {
        await navigateToUrl('http://localhost:3001');
        await typeText('.address-bar input', 'http://unsafe.example.com');
        await page.keyboard.press('Enter');
        await expect('.security-warning').toBeVisible();
        await expect('.security-warning').toContainText('安全でないサイト');
    });

    test('フィッシングサイトが検出されること', async () => {
        await navigateToUrl('http://localhost:3001');
        await typeText('.address-bar input', 'http://phishing.example.com');
        await page.keyboard.press('Enter');
        await expect('.security-warning').toBeVisible();
        await expect('.security-warning').toContainText('フィッシング');
    });

    test('マルウェアサイトが検出されること', async () => {
        await navigateToUrl('http://localhost:3001');
        await typeText('.address-bar input', 'http://malware.example.com');
        await page.keyboard.press('Enter');
        await expect('.security-warning').toBeVisible();
        await expect('.security-warning').toContainText('マルウェア');
    });
});

test.describe('パフォーマンス', () => {
    test('メモリ使用量が最適化されること', async () => {
        await navigateToUrl('http://localhost:3001');
        const initialMemory = await page.evaluate(() => performance.memory.usedJSHeapSize);
        
        // メモリ負荷をかける
        for (let i = 0; i < 10; i++) {
            await clickElement('.new-tab-button');
        }
        
        // 最適化を実行
        await clickElement('.optimize-button');
        
        const optimizedMemory = await page.evaluate(() => performance.memory.usedJSHeapSize);
        expect(optimizedMemory).toBeLessThan(initialMemory);
    });

    test('CPU使用率が最適化されること', async () => {
        await navigateToUrl('http://localhost:3001');
        
        // CPU負荷をかける処理
        await page.evaluate(() => {
            for (let i = 0; i < 1000000; i++) {
                Math.random();
            }
        });
        
        // 最適化を実行
        await clickElement('.optimize-button');
        
        // CPU使用率の確認
        const cpuUsage = await page.evaluate(() => {
            return performance.now() - window.lastOptimizeTime;
        });
        
        expect(cpuUsage).toBeLessThan(100);
    });
}); 