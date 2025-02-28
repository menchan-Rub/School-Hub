import { useState, useCallback, useEffect } from 'react';
import { useApi } from './useApi';
import { useDownloadEvents } from './useWebSocket';

interface Download {
  id: number;
  url: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  status: 'pending' | 'downloading' | 'completed' | 'error' | 'cancelled';
  progress: number;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

interface DownloadProgress {
  downloadId: number;
  progress: number;
  status: Download['status'];
  error?: string;
}

export function useDownloads() {
  const [downloads, setDownloads] = useState<Download[]>([]);
  const { data, loading, error, get, post, delete: del } = useApi<Download[]>();

  // WebSocketイベントの処理
  const handleDownloadUpdate = useCallback((data: Download | DownloadProgress) => {
    if ('id' in data) {
      // Download型の場合（DOWNLOAD_STARTED, DOWNLOAD_COMPLETED）
      setDownloads(prev => {
        const index = prev.findIndex(d => d.id === data.id);
        if (index === -1) {
          return [data, ...prev];
        } else {
          return prev.map(d => d.id === data.id ? data : d);
        }
      });
    } else {
      // DownloadProgress型の場合（DOWNLOAD_PROGRESS, DOWNLOAD_ERROR）
      setDownloads(prev =>
        prev.map(download =>
          download.id === data.downloadId
            ? {
                ...download,
                progress: data.progress,
                status: data.status,
                error: data.error,
              }
            : download
        )
      );
    }
  }, []);

  // WebSocketイベントの購読
  const {
    startDownload: wsStartDownload,
    cancelDownload: wsCancelDownload,
    pauseDownload: wsPauseDownload,
    resumeDownload: wsResumeDownload,
    retryDownload: wsRetryDownload,
  } = useDownloadEvents(handleDownloadUpdate);

  // ダウンロード一覧の取得
  const fetchDownloads = useCallback(async () => {
    try {
      const items = await get('/downloads');
      setDownloads(items);
    } catch (error) {
      console.error('Failed to fetch downloads:', error);
    }
  }, [get]);

  // 初期データの取得
  useEffect(() => {
    fetchDownloads();
  }, [fetchDownloads]);

  // ダウンロードの開始
  const startDownload = useCallback(async (url: string, filename: string) => {
    try {
      const response = await post('/downloads', { url, filename });
      const download = response as unknown as Download;
      wsStartDownload(url, filename);
      setDownloads(prev => [...prev, download]);
      return download;
    } catch (error) {
      console.error('Failed to start download:', error);
      throw error;
    }
  }, [post, wsStartDownload]);

  // ダウンロードのキャンセル
  const cancelDownload = useCallback(async (id: number) => {
    try {
      await del(`/downloads/${id}`);
      wsCancelDownload(id.toString());
      setDownloads(prev =>
        prev.map(download =>
          download.id === id
            ? { ...download, status: 'cancelled' }
            : download
        )
      );
    } catch (error) {
      console.error('Failed to cancel download:', error);
      throw error;
    }
  }, [del, wsCancelDownload]);

  // ダウンロード履歴のクリア
  const clearDownloads = useCallback(async () => {
    try {
      await del('/downloads');
      setDownloads([]);
    } catch (error) {
      console.error('Failed to clear downloads:', error);
      throw error;
    }
  }, [del]);

  // ダウンロードの再試行
  const retryDownload = useCallback(async (id: number) => {
    try {
      const response = await post(`/downloads/${id}/retry`, {});
      const download = response as unknown as Download;
      wsRetryDownload(id.toString());
      setDownloads(prev =>
        prev.map(d => (d.id === id ? download : d))
      );
      return download;
    } catch (error) {
      console.error('Failed to retry download:', error);
      throw error;
    }
  }, [post, wsRetryDownload]);

  // ダウンロードの一時停止
  const pauseDownload = useCallback(async (id: number) => {
    try {
      await post(`/downloads/${id}/pause`, {});
      wsPauseDownload(id.toString());
      setDownloads(prev =>
        prev.map(download =>
          download.id === id
            ? { ...download, status: 'pending' }
            : download
        )
      );
    } catch (error) {
      console.error('Failed to pause download:', error);
      throw error;
    }
  }, [post, wsPauseDownload]);

  // ダウンロードの再開
  const resumeDownload = useCallback(async (id: number) => {
    try {
      await post(`/downloads/${id}/resume`, {});
      wsResumeDownload(id.toString());
      setDownloads(prev =>
        prev.map(download =>
          download.id === id
            ? { ...download, status: 'downloading' }
            : download
        )
      );
    } catch (error) {
      console.error('Failed to resume download:', error);
      throw error;
    }
  }, [post, wsResumeDownload]);

  // ダウンロードファイルを開く
  const openDownload = useCallback(async (id: number) => {
    try {
      await post(`/downloads/${id}/open`, {});
    } catch (error) {
      console.error('Failed to open download:', error);
      throw error;
    }
  }, [post]);

  // ダウンロードフォルダを開く
  const openDownloadFolder = useCallback(async (id: number) => {
    try {
      await post(`/downloads/${id}/open-folder`, {});
    } catch (error) {
      console.error('Failed to open download folder:', error);
      throw error;
    }
  }, [post]);

  return {
    downloads,
    loading,
    error,
    fetchDownloads,
    startDownload,
    cancelDownload,
    clearDownloads,
    retryDownload,
    pauseDownload,
    resumeDownload,
    openDownload,
    openDownloadFolder,
  };
} 