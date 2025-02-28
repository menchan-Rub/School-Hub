const express = require('express');
const router = express.Router();

// 各APIルーターのインポート
const browserRouter = require('./browser');
const bookmarksRouter = require('./bookmarks');
const historyRouter = require('./history');
const downloadsRouter = require('./downloads');
const settingsRouter = require('./settings');
const tabsRouter = require('./tabs');
const healthRouter = require('./health');
const securityRouter = require('./security');
const performanceRouter = require('./performance');
const monitoringRouter = require('./monitoring');
const logsRouter = require('./logs');
const cacheRouter = require('./cache');
const cookiesRouter = require('./cookies');
const backupRouter = require('./backup');
const pdfRouter = require('./pdf');
const screenshotRouter = require('./screenshot');
const readerRouter = require('./reader');
const translateRouter = require('./translate');
const pipRouter = require('./pip');
const prerenderRouter = require('./prerender');
const javascriptRouter = require('./javascript');
const devtoolsRouter = require('./devtools');

// 各APIルートの設定
router.use('/browser', browserRouter);
router.use('/bookmarks', bookmarksRouter);
router.use('/history', historyRouter);
router.use('/downloads', downloadsRouter);
router.use('/settings', settingsRouter);
router.use('/tabs', tabsRouter);
router.use('/health', healthRouter);
router.use('/security', securityRouter);
router.use('/performance', performanceRouter);
router.use('/monitoring', monitoringRouter);
router.use('/logs', logsRouter);
router.use('/cache', cacheRouter);
router.use('/cookies', cookiesRouter);
router.use('/backup', backupRouter);
router.use('/pdf', pdfRouter);
router.use('/screenshot', screenshotRouter);
router.use('/reader', readerRouter);
router.use('/translate', translateRouter);
router.use('/pip', pipRouter);
router.use('/prerender', prerenderRouter);
router.use('/javascript', javascriptRouter);
router.use('/devtools', devtoolsRouter);

module.exports = router; 