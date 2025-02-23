const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const logger = require('../utils/logger');
const config = require('../config');

const pool = new Pool({
  user: config.database.user,
  host: config.database.host,
  database: config.database.database,
  password: config.database.password,
  port: config.database.port,
});

// 翻訳サービスの定義
const TRANSLATION_SERVICES = {
  GOOGLE: 'google',
  DEEPL: 'deepl',
  MICROSOFT: 'microsoft'
};

// 翻訳キャッシュ
const translationCache = new Map();

// 翻訳の実行
router.post('/translate', async (req, res) => {
  const { text, sourceLang, targetLang } = req.body;
  try {
    // 翻訳サービスのAPIキーを設定から取得
    const result = await pool.query(
      "SELECT value->>'apiKey' as api_key FROM settings WHERE key = 'translation'"
    );
    const apiKey = result.rows[0]?.api_key;

    if (!apiKey) {
      return res.status(400).json({ error: 'Translation API key not configured' });
    }

    // Google Cloud Translation APIを使用
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: sourceLang,
          target: targetLang,
          format: 'text'
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Translation API request failed');
    }

    const data = await response.json();
    const translatedText = data.data.translations[0].translatedText;

    // 翻訳履歴を保存
    await pool.query(
      `INSERT INTO translations (
        source_text,
        translated_text,
        source_lang,
        target_lang,
        char_count
      ) VALUES ($1, $2, $3, $4, $5)`,
      [text, translatedText, sourceLang, targetLang, text.length]
    );

    res.json({
      translatedText,
      sourceLang,
      targetLang
    });
  } catch (error) {
    logger.error('Error translating text:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 言語の自動検出
router.post('/detect', async (req, res) => {
  const { text } = req.body;
  try {
    // 翻訳サービスのAPIキーを設定から取得
    const result = await pool.query(
      "SELECT value->>'apiKey' as api_key FROM settings WHERE key = 'translation'"
    );
    const apiKey = result.rows[0]?.api_key;

    if (!apiKey) {
      return res.status(400).json({ error: 'Translation API key not configured' });
    }

    // Google Cloud Translation APIを使用して言語を検出
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2/detect?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Language detection API request failed');
    }

    const data = await response.json();
    const detectedLanguage = data.data.detections[0][0].language;
    const confidence = data.data.detections[0][0].confidence;

    res.json({
      language: detectedLanguage,
      confidence
    });
  } catch (error) {
    logger.error('Error detecting language:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 翻訳履歴の取得
router.get('/history', async (req, res) => {
  const { limit = 100, offset = 0 } = req.query;
  try {
    const result = await pool.query(
      `SELECT * FROM translations
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching translation history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 翻訳履歴の削除
router.delete('/history/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM translations WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Translation history entry not found' });
    }

    res.json({ message: 'Translation history entry deleted successfully' });
  } catch (error) {
    logger.error('Error deleting translation history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 翻訳履歴の全削除
router.delete('/history', async (req, res) => {
  try {
    await pool.query('DELETE FROM translations');
    res.json({ message: 'Translation history cleared successfully' });
  } catch (error) {
    logger.error('Error clearing translation history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// サポートされている言語の取得
router.get('/languages', async (req, res) => {
  try {
    // 翻訳サービスのAPIキーを設定から取得
    const result = await pool.query(
      "SELECT value->>'apiKey' as api_key FROM settings WHERE key = 'translation'"
    );
    const apiKey = result.rows[0]?.api_key;

    if (!apiKey) {
      return res.status(400).json({ error: 'Translation API key not configured' });
    }

    // Google Cloud Translation APIを使用してサポートされている言語を取得
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2/languages?key=${apiKey}&target=ja`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Languages API request failed');
    }

    const data = await response.json();
    const languages = data.data.languages;

    res.json(languages);
  } catch (error) {
    logger.error('Error fetching supported languages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// テキストの翻訳
router.post('/text', async (req, res) => {
  const { text, targetLang, sourceLang = 'auto', service = TRANSLATION_SERVICES.GOOGLE } = req.body;

  try {
    // キャッシュの確認
    const cacheKey = `${text}:${targetLang}:${sourceLang}`;
    const cachedResult = translationCache.get(cacheKey);
    if (cachedResult) {
      return res.json(cachedResult);
    }

    // TODO: 実際の翻訳APIの呼び出し
    // 例: Google Translate API, DeepL API, Microsoft Translator APIなど

    // ダミーの翻訳結果
    const result = {
      translatedText: `Translated: ${text}`,
      detectedLanguage: sourceLang === 'auto' ? 'en' : sourceLang,
      service
    };

    // キャッシュに保存
    translationCache.set(cacheKey, result);

    res.json(result);
  } catch (error) {
    logger.error('Translation error:', error);
    res.status(500).json({ error: 'Translation failed' });
  }
});

// HTMLの翻訳
router.post('/html', async (req, res) => {
  const { html, targetLang, sourceLang = 'auto', service = TRANSLATION_SERVICES.GOOGLE } = req.body;

  try {
    // TODO: HTMLの解析と翻訳
    // 例: cheerioを使用してHTMLを解析し、テキストノードを抽出して翻訳

    // ダミーの翻訳結果
    const result = {
      translatedHtml: html.replace(/>[^<]+</g, match => `>Translated${match.slice(1)}`),
      detectedLanguage: sourceLang === 'auto' ? 'en' : sourceLang,
      service
    };

    res.json(result);
  } catch (error) {
    logger.error('HTML translation error:', error);
    res.status(500).json({ error: 'HTML translation failed' });
  }
});

// 言語の検出
router.post('/detect', async (req, res) => {
  const { text, service = TRANSLATION_SERVICES.GOOGLE } = req.body;

  try {
    // TODO: 実際の言語検出APIの呼び出し
    // 例: Google Cloud Natural Language API, Azure Text Analytics APIなど

    // ダミーの検出結果
    const result = {
      detectedLanguage: 'en',
      confidence: 0.9,
      service
    };

    res.json(result);
  } catch (error) {
    logger.error('Language detection error:', error);
    res.status(500).json({ error: 'Language detection failed' });
  }
});

// 利用可能な言語の取得
router.get('/languages', async (req, res) => {
  const { service = TRANSLATION_SERVICES.GOOGLE } = req.query;

  try {
    // TODO: 実際の翻訳APIから利用可能な言語リストを取得
    // 例: Google Translate API, DeepL API, Microsoft Translator APIなど

    // ダミーの言語リスト
    const languages = [
      { code: 'en', name: 'English' },
      { code: 'ja', name: '日本語' },
      { code: 'zh', name: '中文' },
      { code: 'ko', name: '한국어' }
    ];

    res.json(languages);
  } catch (error) {
    logger.error('Error fetching languages:', error);
    res.status(500).json({ error: 'Failed to fetch languages' });
  }
});

// 翻訳サービスの切り替え
router.post('/service', (req, res) => {
  const { service } = req.body;

  if (!Object.values(TRANSLATION_SERVICES).includes(service)) {
    return res.status(400).json({ error: 'Invalid translation service' });
  }

  // TODO: 翻訳サービスの切り替え処理
  // 例: APIキーの検証、サービスの初期化など

  res.json({ message: 'Translation service switched successfully', service });
});

// キャッシュのクリア
router.delete('/cache', (req, res) => {
  translationCache.clear();
  res.json({ message: 'Translation cache cleared successfully' });
});

module.exports = router; 