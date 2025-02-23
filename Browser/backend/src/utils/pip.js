const logger = require('./logger');

// PiPの状態管理
let pipState = {
  active: false,
  url: null,
  title: null,
  videoTime: 0,
  windowPosition: { x: 0, y: 0 },
  windowSize: { width: 320, height: 180 }
};

// PiPモードの開始
const enterPiP = async (options = {}) => {
  try {
    pipState = {
      active: true,
      url: options.url,
      title: options.title,
      videoTime: options.videoTime || 0,
      windowPosition: options.windowPosition || { x: 0, y: 0 },
      windowSize: options.windowSize || { width: 320, height: 180 }
    };

    logger.info('Entered PiP mode', pipState);
    return pipState;
  } catch (error) {
    logger.error('Failed to enter PiP mode:', error);
    throw error;
  }
};

// PiPモードの終了
const exitPiP = async () => {
  try {
    pipState = {
      active: false,
      url: null,
      title: null,
      videoTime: 0,
      windowPosition: { x: 0, y: 0 },
      windowSize: { width: 320, height: 180 }
    };

    logger.info('Exited PiP mode');
    return true;
  } catch (error) {
    logger.error('Failed to exit PiP mode:', error);
    throw error;
  }
};

// PiPウィンドウの移動
const movePiPWindow = async (position) => {
  try {
    if (!pipState.active) {
      throw new Error('PiP is not active');
    }

    pipState.windowPosition = position;
    logger.debug('PiP window moved', position);
    return pipState;
  } catch (error) {
    logger.error('Failed to move PiP window:', error);
    throw error;
  }
};

// PiPウィンドウのリサイズ
const resizePiPWindow = async (size) => {
  try {
    if (!pipState.active) {
      throw new Error('PiP is not active');
    }

    pipState.windowSize = size;
    logger.debug('PiP window resized', size);
    return pipState;
  } catch (error) {
    logger.error('Failed to resize PiP window:', error);
    throw error;
  }
};

// 再生位置の更新
const updateVideoTime = async (time) => {
  try {
    if (!pipState.active) {
      throw new Error('PiP is not active');
    }

    pipState.videoTime = time;
    logger.debug('Video time updated', { time });
    return pipState;
  } catch (error) {
    logger.error('Failed to update video time:', error);
    throw error;
  }
};

// PiPの状態を取得
const getPiPState = () => {
  return { ...pipState };
};

// PiPが利用可能かチェック
const isPiPAvailable = () => {
  try {
    // TODO: 実際のブラウザ環境でのPiP対応チェック
    return true;
  } catch (error) {
    logger.error('Failed to check PiP availability:', error);
    return false;
  }
};

// PiPウィンドウの最小/最大サイズ
const PIP_CONSTRAINTS = {
  minWidth: 160,
  minHeight: 90,
  maxWidth: 640,
  maxHeight: 360
};

// サイズの検証
const validateSize = (size) => {
  return (
    size.width >= PIP_CONSTRAINTS.minWidth &&
    size.width <= PIP_CONSTRAINTS.maxWidth &&
    size.height >= PIP_CONSTRAINTS.minHeight &&
    size.height <= PIP_CONSTRAINTS.maxHeight
  );
};

module.exports = {
  enterPiP,
  exitPiP,
  movePiPWindow,
  resizePiPWindow,
  updateVideoTime,
  getPiPState,
  isPiPAvailable,
  PIP_CONSTRAINTS,
  validateSize
}; 