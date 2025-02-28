import React, { useEffect, useRef, useState } from 'react';
import styles from '../styles/components/Browser.module.scss';

export const Browser: React.FC = () => {
  const browserViewRef = useRef<HTMLDivElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connectWebSocket = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        return;
      }

      const ws = new WebSocket('ws://localhost:10284');
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log('WebSocket接続が確立されました');
        setIsConnected(true);
        setError(null);

        // 初期タブを作成
        ws.send(JSON.stringify({
          type: 'NEW_TAB',
          url: 'about:blank'
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocketメッセージを受信:', data);

          switch (data.type) {
            case 'CONNECTED':
              console.log('サーバーとの接続が確認されました');
              break;
            case 'TAB_CREATED':
              console.log('新しいタブが作成されました:', data.tabId);
              break;
            case 'ERROR':
              setError(data.message);
              break;
            default:
              console.log('未処理のメッセージタイプ:', data.type);
              break;
          }
        } catch (error) {
          console.error('メッセージの処理中にエラーが発生しました:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocketエラー:', error);
        setError('ブラウザとの接続に失敗しました');
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('WebSocket接続が切断されました');
        setIsConnected(false);
        wsRef.current = null;
        // 3秒後に再接続を試みる
        setTimeout(connectWebSocket, 3000);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // エラー状態の表示
  if (error) {
    return (
      <div className={styles.error}>
        <h2>エラーが発生しました</h2>
        <p>{error}</p>
        <button 
          onClick={() => {
            setError(null);
            setIsConnected(false);
            if (wsRef.current) {
              wsRef.current.close();
            }
          }}
          className={styles.retryButton}
        >
          再接続
        </button>
      </div>
    );
  }

  // 接続待機中の表示
  if (!isConnected) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>ブラウザに接続しています...</p>
      </div>
    );
  }

  // ブラウザビューの表示
  return (
    <div className={styles.browser}>
      <div id="browser-view" ref={browserViewRef} className={styles.browserView} />
    </div>
  );
}; 