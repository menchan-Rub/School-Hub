import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import '../styles/Bookmarks.scss';

interface Bookmark {
  id: number;
  url: string;
  title: string;
  folder_id: number | null;
  favicon_url: string | null;
}

interface Folder {
  id: number;
  name: string;
  parent_id: number | null;
}

export function Bookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBookmarks();
    fetchFolders();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/bookmarks');
      if (!response.ok) throw new Error('Failed to fetch bookmarks');
      const data = await response.json();
      setBookmarks(data);
    } catch (err) {
      setError('ブックマークの読み込みに失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/bookmarks/folders');
      if (!response.ok) throw new Error('Failed to fetch folders');
      const data = await response.json();
      setFolders(data);
    } catch (err) {
      setError('フォルダの読み込みに失敗しました');
      console.error(err);
    }
  };

  const handleBookmarkClick = (url: string) => {
    // WebSocketを通じてURLの読み込みを要求
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

  const handleFolderClick = (folderId: number | null) => {
    setCurrentFolder(folderId);
  };

  const getCurrentFolderBookmarks = () => {
    return bookmarks.filter(bookmark => bookmark.folder_id === currentFolder);
  };

  const getCurrentSubfolders = () => {
    return folders.filter(folder => folder.parent_id === currentFolder);
  };

  if (loading) return <div className="loading">読み込み中...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="bookmarks">
      <div className="folder-path">
        <button
          className="folder-button"
          onClick={() => handleFolderClick(null)}
        >
          ブックマーク
        </button>
        {currentFolder && (
          <span className="folder-name">
            {folders.find(f => f.id === currentFolder)?.name}
          </span>
        )}
      </div>

      <div className="bookmarks-grid">
        {getCurrentSubfolders().map(folder => (
          <div
            key={folder.id}
            className="folder-item"
            onClick={() => handleFolderClick(folder.id)}
          >
            <span className="folder-icon">📁</span>
            <span className="folder-title">{folder.name}</span>
          </div>
        ))}

        {getCurrentFolderBookmarks().map(bookmark => (
          <div
            key={bookmark.id}
            className="bookmark-item"
            onClick={() => handleBookmarkClick(bookmark.url)}
          >
            <img
              className="bookmark-favicon"
              src={bookmark.favicon_url || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='}
              alt=""
            />
            <span className="bookmark-title">{bookmark.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Bookmarks; 