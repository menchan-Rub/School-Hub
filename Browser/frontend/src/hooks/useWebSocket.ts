import { useEffect, useCallback } from 'react';
import { webSocket } from '../utils/websocket';

type MessageHandler = (data: any) => void;

export const useWebSocket = (type: string, handler: MessageHandler) => {
  useEffect(() => {
    webSocket.subscribe(type, handler);
    return () => {
      webSocket.unsubscribe(type, handler);
    };
  }, [type, handler]);

  const send = useCallback(
    (data: any) => {
      webSocket.send(type, data);
    },
    [type]
  );

  return { send };
};

export const useTabEvents = () => {
  const { send: sendNavigate } = useWebSocket('NAVIGATE', () => {});
  const { send: sendCreateTab } = useWebSocket('NEW_TAB', () => {});
  const { send: sendCloseTab } = useWebSocket('CLOSE_TAB', () => {});

  const navigate = useCallback(
    (url: string) => {
      sendNavigate({ url });
    },
    [sendNavigate]
  );

  const createTab = useCallback(
    (url: string) => {
      sendCreateTab({ url });
    },
    [sendCreateTab]
  );

  const closeTab = useCallback(
    (tabId: string) => {
      sendCloseTab({ tabId });
    },
    [sendCloseTab]
  );

  return {
    navigate,
    createTab,
    closeTab,
  };
};

export const useTabState = (onTabUpdate: (data: any) => void) => {
  useEffect(() => {
    webSocket.subscribe('TAB_CREATED', onTabUpdate);
    webSocket.subscribe('TAB_CLOSED', onTabUpdate);
    webSocket.subscribe('URL_CHANGED', onTabUpdate);
    webSocket.subscribe('TITLE_CHANGED', onTabUpdate);
    webSocket.subscribe('FAVICON_CHANGED', onTabUpdate);
    webSocket.subscribe('LOADING_STATE_CHANGED', onTabUpdate);

    return () => {
      webSocket.unsubscribe('TAB_CREATED', onTabUpdate);
      webSocket.unsubscribe('TAB_CLOSED', onTabUpdate);
      webSocket.unsubscribe('URL_CHANGED', onTabUpdate);
      webSocket.unsubscribe('TITLE_CHANGED', onTabUpdate);
      webSocket.unsubscribe('FAVICON_CHANGED', onTabUpdate);
      webSocket.unsubscribe('LOADING_STATE_CHANGED', onTabUpdate);
    };
  }, [onTabUpdate]);

  const sendTabCreated = useCallback(
    (data: any) => {
      webSocket.send('TAB_CREATED', data);
    },
    []
  );

  const sendTabClosed = useCallback(
    (data: any) => {
      webSocket.send('TAB_CLOSED', data);
    },
    []
  );

  const sendUrlChanged = useCallback(
    (data: any) => {
      webSocket.send('URL_CHANGED', data);
    },
    []
  );

  const sendTitleChanged = useCallback(
    (data: any) => {
      webSocket.send('TITLE_CHANGED', data);
    },
    []
  );

  const sendFaviconChanged = useCallback(
    (data: any) => {
      webSocket.send('FAVICON_CHANGED', data);
    },
    []
  );

  const sendLoadingStateChanged = useCallback(
    (data: any) => {
      webSocket.send('LOADING_STATE_CHANGED', data);
    },
    []
  );

  return {
    sendTabCreated,
    sendTabClosed,
    sendUrlChanged,
    sendTitleChanged,
    sendFaviconChanged,
    sendLoadingStateChanged,
  };
};

export const useDownloadEvents = (onDownloadUpdate: (data: any) => void) => {
  useEffect(() => {
    webSocket.subscribe('DOWNLOAD_STARTED', onDownloadUpdate);
    webSocket.subscribe('DOWNLOAD_PROGRESS', onDownloadUpdate);
    webSocket.subscribe('DOWNLOAD_COMPLETED', onDownloadUpdate);
    webSocket.subscribe('DOWNLOAD_ERROR', onDownloadUpdate);

    return () => {
      webSocket.unsubscribe('DOWNLOAD_STARTED', onDownloadUpdate);
      webSocket.unsubscribe('DOWNLOAD_PROGRESS', onDownloadUpdate);
      webSocket.unsubscribe('DOWNLOAD_COMPLETED', onDownloadUpdate);
      webSocket.unsubscribe('DOWNLOAD_ERROR', onDownloadUpdate);
    };
  }, [onDownloadUpdate]);

  const startDownload = useCallback(
    (url: string, filename: string) => {
      webSocket.send('START_DOWNLOAD', { url, filename });
    },
    []
  );

  const cancelDownload = useCallback(
    (downloadId: string) => {
      webSocket.send('CANCEL_DOWNLOAD', { downloadId });
    },
    []
  );

  const pauseDownload = useCallback(
    (downloadId: string) => {
      webSocket.send('PAUSE_DOWNLOAD', { downloadId });
    },
    []
  );

  const resumeDownload = useCallback(
    (downloadId: string) => {
      webSocket.send('RESUME_DOWNLOAD', { downloadId });
    },
    []
  );

  const retryDownload = useCallback(
    (downloadId: string) => {
      webSocket.send('RETRY_DOWNLOAD', { downloadId });
    },
    []
  );

  return {
    startDownload,
    cancelDownload,
    pauseDownload,
    resumeDownload,
    retryDownload,
  };
}; 