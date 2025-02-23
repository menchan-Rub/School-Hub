import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Browser } from './components/Browser';
import { webSocket } from './utils/websocket';
import './styles/global.scss';

const App: React.FC = () => {
  useEffect(() => {
    // WebSocket接続の初期化
    webSocket.connect();

    // コンポーネントのアンマウント時にWebSocket接続を閉じる
    return () => {
      webSocket.close();
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Browser />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App; 