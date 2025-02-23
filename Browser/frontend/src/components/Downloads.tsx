import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import '../styles/Downloads.scss';

interface Download {
  id: number;
  url: string;
  filename: string;
  mime_type: string;
  size: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  start_time: string;
  end_time: string | null;
  local_path: string | null;
}

export function Downloads() {
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDownloads();
    setupWebSocket();
  }, []);

  const fetchDownloads = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/downloads');
      if (!response.ok) throw new Error('Failed to fetch downloads');
      const data = await response.json();
      setDownloads(data);
    } catch (err) {
      setError('ダウンロード履歴の読み込みに失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = () => {
    try {
      const ws = new WebSocket('ws://localhost:3000');

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'DOWNLOAD_STARTED':
            setDownloads(prev => [data.download, ...prev]);
            break;
          case 'DOWNLOAD_UPDATED':
            setDownloads(prev =>
              prev.map(d => d.id === data.download.id ? data.download : d)
            );
            break;
          case 'DOWNLOAD_CANCELLED':
            setDownloads(prev =>
              prev.map(d => d.id === data.download.id ? data.download : d)
            );
            break;
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      return () => ws.close();
    } catch (err) {
      console.error('WebSocket connection failed:', err);
    }
  };

  const handleCancel = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/downloads/${id}/cancel`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to cancel download');
    } catch (err) {
      setError('ダウンロードのキャンセルに失敗しました');
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/downloads/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete download');
      setDownloads(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      setError('ダウンロードの削除に失敗しました');
      console.error(err);
    }
  };

  const formatSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  if (loading) return <div className="loading">読み込み中...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="downloads">
      <h1>ダウンロード</h1>

      <div className="downloads-list">
        {downloads.map(download => (
          <div key={download.id} className="download-item">
            <div className="download-icon">
              {download.status === 'completed' ? '✓' :
               download.status === 'failed' ? '✕' :
               download.status === 'cancelled' ? '⊘' : '↓'}
            </div>
            <div className="download-content">
              <div className="download-filename">{download.filename}</div>
              <div className="download-url">{download.url}</div>
              <div className="download-details">
                {download.size && <span>{formatSize(download.size)}</span>}
                <span>{formatDate(download.start_time)}</span>
                <span className={`download-status status-${download.status}`}>
                  {download.status === 'completed' ? '完了' :
                   download.status === 'failed' ? '失敗' :
                   download.status === 'cancelled' ? 'キャンセル' : 'ダウンロード中'}
                </span>
              </div>
            </div>
            <div className="download-actions">
              {download.status === 'pending' && (
                <button
                  className="cancel-button"
                  onClick={() => handleCancel(download.id)}
                >
                  キャンセル
                </button>
              )}
              {['completed', 'failed', 'cancelled'].includes(download.status) && (
                <button
                  className="delete-button"
                  onClick={() => handleDelete(download.id)}
                >
                  削除
                </button>
              )}
            </div>
          </div>
        ))}

        {downloads.length === 0 && (
          <div className="no-downloads">
            ダウンロード履歴はありません
          </div>
        )}
      </div>
    </div>
  );
}

export default Downloads; 