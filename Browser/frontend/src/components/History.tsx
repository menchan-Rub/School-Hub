import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import '../styles/History.scss';

interface HistoryEntry {
  id: number;
  url: string;
  title: string;
  visit_date: string;
  favicon_url: string | null;
}

export function History() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/history');
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      setHistory(data);
    } catch (err) {
      setError('履歴の読み込みに失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) {
      fetchHistory();
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/history/search?query=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Failed to search history');
      const data = await response.json();
      setHistory(data);
    } catch (err) {
      setError('履歴の検索に失敗しました');
      console.error(err);
    }
  };

  const handleHistoryClick = (url: string) => {
    try {
      const ws = new WebSocket('ws://localhost:3000');
      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'NAVIGATE',
          url
        }));
      };
    } catch (err) {
      console.error('WebSocket connection failed:', err);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('本当に履歴を削除しますか？')) return;

    try {
      const response = await fetch('http://localhost:3000/api/history', {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to clear history');
      setHistory([]);
    } catch (err) {
      setError('履歴の削除に失敗しました');
      console.error(err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) return <div className="loading">読み込み中...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="history">
      <div className="history-header">
        <div className="search-bar">
          <input
            type="text"
            className="search-input"
            value={searchQuery}
            onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
            placeholder="履歴を検索"
          />
          <button className="search-button" onClick={handleSearch}>
            🔍
          </button>
        </div>
        <button className="clear-button" onClick={handleClearHistory}>
          履歴を削除
        </button>
      </div>

      <div className="history-list">
        {history.map(entry => (
          <div
            key={entry.id}
            className="history-item"
            onClick={() => handleHistoryClick(entry.url)}
          >
            <img
              className="history-favicon"
              src={entry.favicon_url || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='}
              alt=""
            />
            <div className="history-content">
              <div className="history-title">{entry.title || entry.url}</div>
              <div className="history-url">{entry.url}</div>
              <div className="history-date">{formatDate(entry.visit_date)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default History; 