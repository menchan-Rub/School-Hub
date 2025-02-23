const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

// PDFの作成
const createPDF = async (options = {}) => {
  try {
    const doc = await PDFDocument.create();
    
    // フォントの設定
    const font = await doc.embedFont(StandardFonts.Helvetica);
    
    // ページの追加
    const page = doc.addPage([options.width || 595, options.height || 842]);
    
    // メタデータの設定
    doc.setTitle(options.title || 'Untitled Document');
    doc.setAuthor(options.author || 'Browser PDF Generator');
    doc.setCreator('Browser PDF Utils');
    
    return doc;
  } catch (error) {
    logger.error('Failed to create PDF:', error);
    throw error;
  }
};

// HTMLからPDFを生成
const generateFromHtml = async (html, options = {}) => {
  try {
    // TODO: HTML to PDF変換の実装
    // 例: Puppeteerやwkhtmltopdfを使用
    
    logger.info('Generating PDF from HTML', {
      size: html.length,
      options
    });
    
    return Buffer.from('dummy pdf content');
  } catch (error) {
    logger.error('Failed to generate PDF from HTML:', error);
    throw error;
  }
};

// PDFの保存
const savePDF = async (doc, filePath) => {
  try {
    const pdfBytes = await doc.save();
    await fs.writeFile(filePath, pdfBytes);
    
    logger.info('PDF saved successfully', {
      path: filePath,
      size: pdfBytes.length
    });
    
    return {
      path: filePath,
      size: pdfBytes.length
    };
  } catch (error) {
    logger.error('Failed to save PDF:', error);
    throw error;
  }
};

// PDFの結合
const mergePDFs = async (pdfPaths) => {
  try {
    const mergedDoc = await PDFDocument.create();
    
    for (const pdfPath of pdfPaths) {
      const pdfBytes = await fs.readFile(pdfPath);
      const pdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedDoc.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach(page => mergedDoc.addPage(page));
    }
    
    logger.info('PDFs merged successfully', {
      count: pdfPaths.length
    });
    
    return mergedDoc;
  } catch (error) {
    logger.error('Failed to merge PDFs:', error);
    throw error;
  }
};

// PDFの圧縮
const compressPDF = async (pdfPath, options = {}) => {
  try {
    const pdfBytes = await fs.readFile(pdfPath);
    const pdf = await PDFDocument.load(pdfBytes);
    
    // 圧縮オプションの設定
    const compressedBytes = await pdf.save({
      useObjectStreams: true,
      addDefaultPage: false,
      ...options
    });
    
    logger.info('PDF compressed successfully', {
      originalSize: pdfBytes.length,
      compressedSize: compressedBytes.length
    });
    
    return compressedBytes;
  } catch (error) {
    logger.error('Failed to compress PDF:', error);
    throw error;
  }
};

// PDFのメタデータ取得
const getPDFMetadata = async (pdfPath) => {
  try {
    const pdfBytes = await fs.readFile(pdfPath);
    const pdf = await PDFDocument.load(pdfBytes);
    
    const metadata = {
      title: pdf.getTitle(),
      author: pdf.getAuthor(),
      creator: pdf.getCreator(),
      producer: pdf.getProducer(),
      pageCount: pdf.getPageCount(),
      size: pdfBytes.length
    };
    
    logger.debug('PDF metadata retrieved', metadata);
    
    return metadata;
  } catch (error) {
    logger.error('Failed to get PDF metadata:', error);
    throw error;
  }
};

// PDFのページ抽出
const extractPages = async (pdfPath, pageNumbers) => {
  try {
    const pdfBytes = await fs.readFile(pdfPath);
    const sourcePdf = await PDFDocument.load(pdfBytes);
    const newPdf = await PDFDocument.create();
    
    for (const pageNumber of pageNumbers) {
      if (pageNumber > 0 && pageNumber <= sourcePdf.getPageCount()) {
        const [page] = await newPdf.copyPages(sourcePdf, [pageNumber - 1]);
        newPdf.addPage(page);
      }
    }
    
    logger.info('PDF pages extracted successfully', {
      source: pdfPath,
      pages: pageNumbers
    });
    
    return newPdf;
  } catch (error) {
    logger.error('Failed to extract PDF pages:', error);
    throw error;
  }
};

// PDFの暗号化
const encryptPDF = async (pdfPath, password) => {
  try {
    const pdfBytes = await fs.readFile(pdfPath);
    const pdf = await PDFDocument.load(pdfBytes);
    
    // パスワード保護の設定
    pdf.encrypt({
      userPassword: password,
      ownerPassword: password,
      permissions: {
        printing: 'highResolution',
        modifying: false,
        copying: false,
        annotating: false
      }
    });
    
    logger.info('PDF encrypted successfully', {
      path: pdfPath
    });
    
    return pdf;
  } catch (error) {
    logger.error('Failed to encrypt PDF:', error);
    throw error;
  }
};

module.exports = {
  createPDF,
  generateFromHtml,
  savePDF,
  mergePDFs,
  compressPDF,
  getPDFMetadata,
  extractPages,
  encryptPDF
}; 