const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const logger = require('../utils/logger');
const config = require('../config');
const fs = require('fs').promises;
const path = require('path');
const pdf = require('pdf-lib');

const pool = new Pool({
  user: config.database.user,
  host: config.database.host,
  database: config.database.database,
  password: config.database.password,
  port: config.database.port,
});

// PDFファイルの一覧取得
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM pdf_files ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching PDF files:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PDFファイルの取得
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM pdf_files WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'PDF file not found' });
    }

    const pdfFile = result.rows[0];
    const filePath = path.join(config.downloads.defaultLocation, pdfFile.filename);

    // ファイルの存在確認
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ error: 'PDF file not found on disk' });
    }

    // PDFファイルを送信
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${pdfFile.filename}"`);
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    logger.error('Error fetching PDF file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PDFファイルの保存
router.post('/', async (req, res) => {
  const { url, filename, size } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO pdf_files (url, filename, size, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [url, filename, size]
    );

    const pdfFile = result.rows[0];

    // WebSocketを通じてPDFの保存開始を通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'PDF_SAVE_STARTED',
          pdf: pdfFile
        }));
      }
    });

    res.status(201).json(pdfFile);

    // 非同期でPDFを保存
    savePDF(pdfFile);
  } catch (error) {
    logger.error('Error saving PDF file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PDFファイルの削除
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM pdf_files WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'PDF file not found' });
    }

    const pdfFile = result.rows[0];
    const filePath = path.join(config.downloads.defaultLocation, pdfFile.filename);

    // ファイルの削除
    try {
      await fs.unlink(filePath);
    } catch (error) {
      logger.warn('Error deleting PDF file from disk:', error);
    }

    // WebSocketを通じてPDFの削除を通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'PDF_DELETED',
          pdfId: id
        }));
      }
    });

    res.json({ message: 'PDF file deleted successfully' });
  } catch (error) {
    logger.error('Error deleting PDF file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PDFの変換と保存を行う非同期関数
async function savePDF(pdfFile) {
  try {
    // PDFファイルをダウンロード
    const response = await fetch(pdfFile.url);
    const pdfBytes = await response.arrayBuffer();

    // PDFドキュメントを読み込み
    const pdfDoc = await pdf.PDFDocument.load(pdfBytes);

    // PDFのメタデータを取得
    const pageCount = pdfDoc.getPageCount();
    const title = pdfDoc.getTitle() || '';

    // PDFファイルを保存
    const filePath = path.join(config.downloads.defaultLocation, pdfFile.filename);
    await fs.writeFile(filePath, Buffer.from(pdfBytes));

    // データベースを更新
    await pool.query(
      `UPDATE pdf_files
       SET status = 'completed',
           page_count = $1,
           title = $2,
           completed_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [pageCount, title, pdfFile.id]
    );

    // WebSocketを通じて保存完了を通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'PDF_SAVE_COMPLETED',
          pdf: {
            ...pdfFile,
            status: 'completed',
            page_count: pageCount,
            title,
            completed_at: new Date()
          }
        }));
      }
    });
  } catch (error) {
    logger.error('Error saving PDF:', error);

    // エラーをデータベースに記録
    await pool.query(
      `UPDATE pdf_files
       SET status = 'failed',
           error = $1,
           completed_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [error.message, pdfFile.id]
    );

    // WebSocketを通じてエラーを通知
    global.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'PDF_SAVE_FAILED',
          pdf: {
            ...pdfFile,
            status: 'failed',
            error: error.message,
            completed_at: new Date()
          }
        }));
      }
    });
  }
}

module.exports = router; 