const {
  generatePDF,
  convertToPDF,
  mergePDFs,
  splitPDF,
  extractPages,
  addWatermark,
  compressPDF,
  encryptPDF
} = require('../utils/pdf');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

jest.mock('../utils/logger');
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    unlink: jest.fn(),
    access: jest.fn()
  }
}));

describe('PDF Utils Tests', () => {
  const testDir = path.join(__dirname, '../../test-files');
  const samplePDF = path.join(testDir, 'sample.pdf');
  const outputPDF = path.join(testDir, 'output.pdf');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PDF Generation', () => {
    test('should generate PDF from HTML', async () => {
      const html = '<html><body><h1>Test</h1></body></html>';
      const options = {
        format: 'A4',
        margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
      };

      await generatePDF(html, outputPDF, options);

      expect(fs.writeFile).toHaveBeenCalledWith(
        outputPDF,
        expect.any(Buffer),
        'binary'
      );
      expect(logger.info).toHaveBeenCalledWith('PDF generated:', { path: outputPDF });
    });

    test('should handle generation error', async () => {
      const html = null;
      const error = new Error('Generation failed');
      fs.writeFile.mockRejectedValue(error);

      await expect(generatePDF(html, outputPDF)).rejects.toThrow('Generation failed');
      expect(logger.error).toHaveBeenCalledWith('PDF generation failed:', error);
    });

    test('should validate input HTML', async () => {
      const invalidHTML = null;

      await expect(generatePDF(invalidHTML, outputPDF))
        .rejects.toThrow('Invalid HTML content');
    });
  });

  describe('PDF Conversion', () => {
    test('should convert document to PDF', async () => {
      const inputFile = 'document.docx';
      const options = {
        format: 'A4',
        quality: 'high'
      };

      await convertToPDF(inputFile, outputPDF, options);

      expect(fs.writeFile).toHaveBeenCalledWith(
        outputPDF,
        expect.any(Buffer),
        'binary'
      );
      expect(logger.info).toHaveBeenCalledWith('Document converted to PDF:', {
        input: inputFile,
        output: outputPDF
      });
    });

    test('should handle conversion error', async () => {
      const inputFile = 'invalid.doc';
      const error = new Error('Conversion failed');
      fs.readFile.mockRejectedValue(error);

      await expect(convertToPDF(inputFile, outputPDF))
        .rejects.toThrow('Conversion failed');
      expect(logger.error).toHaveBeenCalledWith('PDF conversion failed:', error);
    });

    test('should validate input file format', async () => {
      const invalidFile = 'document.xyz';

      await expect(convertToPDF(invalidFile, outputPDF))
        .rejects.toThrow('Unsupported file format');
    });
  });

  describe('PDF Merging', () => {
    test('should merge multiple PDFs', async () => {
      const inputFiles = [
        'file1.pdf',
        'file2.pdf',
        'file3.pdf'
      ];

      await mergePDFs(inputFiles, outputPDF);

      expect(fs.writeFile).toHaveBeenCalledWith(
        outputPDF,
        expect.any(Buffer),
        'binary'
      );
      expect(logger.info).toHaveBeenCalledWith('PDFs merged:', {
        inputs: inputFiles,
        output: outputPDF
      });
    });

    test('should handle merge error', async () => {
      const inputFiles = ['invalid.pdf'];
      const error = new Error('Merge failed');
      fs.readFile.mockRejectedValue(error);

      await expect(mergePDFs(inputFiles, outputPDF))
        .rejects.toThrow('Merge failed');
      expect(logger.error).toHaveBeenCalledWith('PDF merge failed:', error);
    });

    test('should validate input files', async () => {
      const invalidFiles = [];

      await expect(mergePDFs(invalidFiles, outputPDF))
        .rejects.toThrow('No input files provided');
    });
  });

  describe('PDF Splitting', () => {
    test('should split PDF into multiple files', async () => {
      const pageRanges = [
        { start: 1, end: 3 },
        { start: 4, end: 6 }
      ];

      await splitPDF(samplePDF, testDir, pageRanges);

      expect(fs.writeFile).toHaveBeenCalledTimes(pageRanges.length);
      expect(logger.info).toHaveBeenCalledWith('PDF split completed:', {
        input: samplePDF,
        outputDir: testDir
      });
    });

    test('should handle split error', async () => {
      const error = new Error('Split failed');
      fs.readFile.mockRejectedValue(error);

      await expect(splitPDF(samplePDF, testDir))
        .rejects.toThrow('Split failed');
      expect(logger.error).toHaveBeenCalledWith('PDF split failed:', error);
    });

    test('should validate page ranges', async () => {
      const invalidRanges = [
        { start: 0, end: 1 }, // Invalid start page
        { start: 2, end: 1 }  // End before start
      ];

      await expect(splitPDF(samplePDF, testDir, invalidRanges))
        .rejects.toThrow('Invalid page range');
    });
  });

  describe('Page Extraction', () => {
    test('should extract specific pages', async () => {
      const pages = [1, 3, 5];

      await extractPages(samplePDF, outputPDF, pages);

      expect(fs.writeFile).toHaveBeenCalledWith(
        outputPDF,
        expect.any(Buffer),
        'binary'
      );
      expect(logger.info).toHaveBeenCalledWith('Pages extracted:', {
        input: samplePDF,
        pages,
        output: outputPDF
      });
    });

    test('should handle extraction error', async () => {
      const error = new Error('Extraction failed');
      fs.readFile.mockRejectedValue(error);

      await expect(extractPages(samplePDF, outputPDF, [1]))
        .rejects.toThrow('Extraction failed');
      expect(logger.error).toHaveBeenCalledWith('Page extraction failed:', error);
    });

    test('should validate page numbers', async () => {
      const invalidPages = [0, -1, 'a'];

      await expect(extractPages(samplePDF, outputPDF, invalidPages))
        .rejects.toThrow('Invalid page numbers');
    });
  });

  describe('Watermark Addition', () => {
    test('should add watermark to PDF', async () => {
      const watermark = {
        text: 'CONFIDENTIAL',
        font: 'Helvetica',
        size: 48,
        color: 'gray',
        opacity: 0.5
      };

      await addWatermark(samplePDF, outputPDF, watermark);

      expect(fs.writeFile).toHaveBeenCalledWith(
        outputPDF,
        expect.any(Buffer),
        'binary'
      );
      expect(logger.info).toHaveBeenCalledWith('Watermark added:', {
        input: samplePDF,
        output: outputPDF
      });
    });

    test('should handle watermark error', async () => {
      const error = new Error('Watermark failed');
      fs.readFile.mockRejectedValue(error);

      await expect(addWatermark(samplePDF, outputPDF, {}))
        .rejects.toThrow('Watermark failed');
      expect(logger.error).toHaveBeenCalledWith('Watermark addition failed:', error);
    });

    test('should validate watermark options', async () => {
      const invalidWatermark = {
        text: '',
        opacity: 2
      };

      await expect(addWatermark(samplePDF, outputPDF, invalidWatermark))
        .rejects.toThrow('Invalid watermark options');
    });
  });

  describe('PDF Compression', () => {
    test('should compress PDF file', async () => {
      const options = {
        quality: 'medium',
        imageQuality: 80
      };

      await compressPDF(samplePDF, outputPDF, options);

      expect(fs.writeFile).toHaveBeenCalledWith(
        outputPDF,
        expect.any(Buffer),
        'binary'
      );
      expect(logger.info).toHaveBeenCalledWith('PDF compressed:', {
        input: samplePDF,
        output: outputPDF,
        options
      });
    });

    test('should handle compression error', async () => {
      const error = new Error('Compression failed');
      fs.readFile.mockRejectedValue(error);

      await expect(compressPDF(samplePDF, outputPDF))
        .rejects.toThrow('Compression failed');
      expect(logger.error).toHaveBeenCalledWith('PDF compression failed:', error);
    });

    test('should validate compression options', async () => {
      const invalidOptions = {
        quality: 'invalid',
        imageQuality: 101
      };

      await expect(compressPDF(samplePDF, outputPDF, invalidOptions))
        .rejects.toThrow('Invalid compression options');
    });
  });

  describe('PDF Encryption', () => {
    test('should encrypt PDF file', async () => {
      const options = {
        userPassword: 'user123',
        ownerPassword: 'owner123',
        permissions: {
          printing: true,
          modifying: false,
          copying: false,
          annotating: true
        }
      };

      await encryptPDF(samplePDF, outputPDF, options);

      expect(fs.writeFile).toHaveBeenCalledWith(
        outputPDF,
        expect.any(Buffer),
        'binary'
      );
      expect(logger.info).toHaveBeenCalledWith('PDF encrypted:', {
        input: samplePDF,
        output: outputPDF
      });
    });

    test('should handle encryption error', async () => {
      const error = new Error('Encryption failed');
      fs.readFile.mockRejectedValue(error);

      await expect(encryptPDF(samplePDF, outputPDF, {}))
        .rejects.toThrow('Encryption failed');
      expect(logger.error).toHaveBeenCalledWith('PDF encryption failed:', error);
    });

    test('should validate encryption options', async () => {
      const invalidOptions = {
        userPassword: '',
        permissions: 'invalid'
      };

      await expect(encryptPDF(samplePDF, outputPDF, invalidOptions))
        .rejects.toThrow('Invalid encryption options');
    });
  });
}); 