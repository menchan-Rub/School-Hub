const {
  createPiPWindow,
  enterPiPMode,
  exitPiPMode,
  resizePiPWindow,
  movePiPWindow,
  togglePiPControls,
  handlePiPEvents,
  getPiPState
} = require('../utils/pip');
const logger = require('../utils/logger');

jest.mock('../utils/logger');

describe('Picture-in-Picture Tests', () => {
  let pipWindow;
  let mediaElement;

  beforeEach(() => {
    pipWindow = {
      width: 320,
      height: 180,
      x: 100,
      y: 100,
      isVisible: true,
      show: jest.fn(),
      hide: jest.fn(),
      close: jest.fn(),
      setBounds: jest.fn(),
      setPosition: jest.fn(),
      on: jest.fn()
    };

    mediaElement = {
      requestPictureInPicture: jest.fn(),
      exitPictureInPicture: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      paused: false,
      play: jest.fn(),
      pause: jest.fn()
    };

    jest.clearAllMocks();
  });

  describe('PiP Window Creation', () => {
    test('should create PiP window successfully', () => {
      const options = {
        width: 320,
        height: 180,
        alwaysOnTop: true
      };

      const window = createPiPWindow(options);

      expect(window).toBeDefined();
      expect(window.width).toBe(options.width);
      expect(window.height).toBe(options.height);
      expect(logger.info).toHaveBeenCalledWith('PiP window created:', expect.any(Object));
    });

    test('should set default window options', () => {
      const window = createPiPWindow();

      expect(window.width).toBeGreaterThan(0);
      expect(window.height).toBeGreaterThan(0);
      expect(window.alwaysOnTop).toBe(true);
    });

    test('should handle window creation error', () => {
      const error = new Error('Window creation failed');
      jest.spyOn(global, 'BrowserWindow').mockImplementation(() => {
        throw error;
      });

      expect(() => createPiPWindow()).toThrow('Window creation failed');
      expect(logger.error).toHaveBeenCalledWith('Failed to create PiP window:', error);
    });
  });

  describe('PiP Mode Control', () => {
    test('should enter PiP mode', async () => {
      mediaElement.requestPictureInPicture.mockResolvedValue(pipWindow);

      await enterPiPMode(mediaElement);

      expect(mediaElement.requestPictureInPicture).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Entered PiP mode');
    });

    test('should exit PiP mode', async () => {
      mediaElement.exitPictureInPicture.mockResolvedValue();

      await exitPiPMode(mediaElement);

      expect(mediaElement.exitPictureInPicture).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Exited PiP mode');
    });

    test('should handle PiP mode errors', async () => {
      const error = new Error('PiP mode failed');
      mediaElement.requestPictureInPicture.mockRejectedValue(error);

      await expect(enterPiPMode(mediaElement)).rejects.toThrow('PiP mode failed');
      expect(logger.error).toHaveBeenCalledWith('Failed to enter PiP mode:', error);
    });
  });

  describe('Window Resizing', () => {
    test('should resize PiP window', () => {
      const size = {
        width: 400,
        height: 225
      };

      resizePiPWindow(pipWindow, size);

      expect(pipWindow.setBounds).toHaveBeenCalledWith(
        expect.objectContaining({
          width: size.width,
          height: size.height
        })
      );
      expect(logger.info).toHaveBeenCalledWith('PiP window resized:', size);
    });

    test('should maintain aspect ratio', () => {
      const size = {
        width: 400,
        height: 300 // Invalid aspect ratio
      };

      resizePiPWindow(pipWindow, size);

      expect(pipWindow.setBounds).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 400,
          height: 225 // Corrected height for 16:9 aspect ratio
        })
      );
    });

    test('should validate window size', () => {
      const invalidSizes = [
        { width: 0, height: 100 },
        { width: 100, height: 0 },
        { width: -100, height: 100 }
      ];

      invalidSizes.forEach(size => {
        expect(() => resizePiPWindow(pipWindow, size)).toThrow('Invalid window size');
      });
    });
  });

  describe('Window Movement', () => {
    test('should move PiP window', () => {
      const position = {
        x: 200,
        y: 200
      };

      movePiPWindow(pipWindow, position);

      expect(pipWindow.setPosition).toHaveBeenCalledWith(position.x, position.y);
      expect(logger.info).toHaveBeenCalledWith('PiP window moved:', position);
    });

    test('should keep window within screen bounds', () => {
      const screenBounds = {
        width: 1920,
        height: 1080
      };
      const position = {
        x: screenBounds.width + 100, // Beyond screen width
        y: screenBounds.height + 100 // Beyond screen height
      };

      movePiPWindow(pipWindow, position);

      expect(pipWindow.setPosition).toHaveBeenCalledWith(
        screenBounds.width - pipWindow.width,
        screenBounds.height - pipWindow.height
      );
    });

    test('should validate window position', () => {
      const invalidPositions = [
        { x: 'invalid', y: 100 },
        { x: 100, y: 'invalid' }
      ];

      invalidPositions.forEach(position => {
        expect(() => movePiPWindow(pipWindow, position)).toThrow('Invalid window position');
      });
    });
  });

  describe('Controls Management', () => {
    test('should toggle PiP controls', () => {
      const show = true;

      togglePiPControls(pipWindow, show);

      expect(pipWindow.webContents.executeJavaScript).toHaveBeenCalledWith(
        expect.stringContaining('toggleControls')
      );
      expect(logger.info).toHaveBeenCalledWith('PiP controls toggled:', { show });
    });

    test('should handle control toggle error', () => {
      const error = new Error('Toggle failed');
      pipWindow.webContents.executeJavaScript.mockRejectedValue(error);

      expect(() => togglePiPControls(pipWindow, true)).toThrow('Toggle failed');
      expect(logger.error).toHaveBeenCalledWith('Failed to toggle PiP controls:', error);
    });
  });

  describe('Event Handling', () => {
    test('should handle PiP events', () => {
      const events = {
        onEnter: jest.fn(),
        onExit: jest.fn(),
        onResize: jest.fn(),
        onMove: jest.fn()
      };

      handlePiPEvents(pipWindow, events);

      expect(pipWindow.on).toHaveBeenCalledWith('enter-pip-mode', events.onEnter);
      expect(pipWindow.on).toHaveBeenCalledWith('leave-pip-mode', events.onExit);
      expect(pipWindow.on).toHaveBeenCalledWith('resize', events.onResize);
      expect(pipWindow.on).toHaveBeenCalledWith('move', events.onMove);
    });

    test('should handle media events', () => {
      const events = {
        onPlay: jest.fn(),
        onPause: jest.fn(),
        onEnded: jest.fn()
      };

      handlePiPEvents(pipWindow, events);

      expect(mediaElement.addEventListener).toHaveBeenCalledWith('play', events.onPlay);
      expect(mediaElement.addEventListener).toHaveBeenCalledWith('pause', events.onPause);
      expect(mediaElement.addEventListener).toHaveBeenCalledWith('ended', events.onEnded);
    });

    test('should cleanup event listeners', () => {
      const cleanup = handlePiPEvents(pipWindow, {});
      cleanup();

      expect(pipWindow.removeAllListeners).toHaveBeenCalled();
      expect(mediaElement.removeEventListener).toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    test('should get PiP state', () => {
      const state = getPiPState(pipWindow);

      expect(state).toEqual({
        isActive: true,
        position: { x: pipWindow.x, y: pipWindow.y },
        size: { width: pipWindow.width, height: pipWindow.height },
        isPlaying: !mediaElement.paused
      });
    });

    test('should handle inactive window', () => {
      pipWindow.isDestroyed.mockReturnValue(true);

      const state = getPiPState(pipWindow);

      expect(state.isActive).toBe(false);
    });
  });
}); 