const express = require('express');
const router = express.Router();
const { browser } = require('../utils/cef');
const logger = require('../utils/logger');

// ブラウザの起動
router.post('/launch', async (req, res) => {
  try {
    await browser.start();
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to launch browser:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ブラウザの終了
router.post('/shutdown', async (req, res) => {
  try {
    await browser.stop();
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to shutdown browser:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ブラウザの状態取得
router.get('/status', (req, res) => {
  try {
    const status = {
      isRunning: browser.process !== null,
      tabs: Array.from(browser.tabs.entries()),
      processId: browser.process?.pid
    };
    res.json(status);
  } catch (error) {
    logger.error('Failed to get browser status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;