// Winstonロガーのモック
const logger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  on: jest.fn()
};

module.exports = logger; 