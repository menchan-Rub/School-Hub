import { h } from 'preact';
import { Router } from 'preact-router';
import { signal } from '@preact/signals';
import { useNavigationStore } from '../lib/stores/navigation-store';
import { ComponentProps } from 'preact';

import Tab from './Tab';
import { AddressBar } from './AddressBar';
import { Browser } from './Browser';
import Bookmarks from './Bookmarks';
import History from './History';
import Settings from './Settings';
import Downloads from './Downloads';

import '../styles/App.scss';

// グローバル状態の管理
export const activeTab = signal(0);
export const tabs = signal([{ id: 0, url: '', title: '' }]);

type RouteProps = {
  path: string;
};

export function App() {
  const { activeView } = useNavigationStore();

  // ブラウザビューの表示
  if (activeView === 'browser') {
    return <Browser />;
  }

  // その他のビューの表示
  return (
    <div className="browser-app">
      <header className="browser-header">
        <div className="tab-bar">
          {tabs.value.map((tab, index) => (
            <Tab
              key={tab.id}
              isActive={activeTab.value === index}
              title={tab.title}
              onClose={() => handleCloseTab(index)}
              onClick={() => handleTabClick(index)}
            />
          ))}
          <button className="new-tab-button" onClick={handleNewTab}>
            +
          </button>
        </div>
        <AddressBar onNavigate={(url) => {
          const ws = new WebSocket('ws://localhost:10284');
          ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'NAVIGATE', url }));
          };
        }} />
      </header>

      <main className="browser-content">
        {/* @ts-ignore */}
        <Router>
          <Bookmarks path="/bookmarks" />
          <History path="/history" />
          <Settings path="/settings" />
          <Downloads path="/downloads" />
        </Router>
      </main>
    </div>
  );
}

// タブ操作のハンドラー
function handleNewTab() {
  const newTab = {
    id: tabs.value.length,
    url: '',
    title: '新しいタブ'
  };
  tabs.value = [...tabs.value, newTab];
  activeTab.value = tabs.value.length - 1;
}

function handleCloseTab(index: number) {
  if (tabs.value.length === 1) {
    // 最後のタブは閉じない
    return;
  }

  const newTabs = tabs.value.filter((_, i) => i !== index);
  tabs.value = newTabs;

  if (activeTab.value >= index) {
    activeTab.value = Math.max(0, activeTab.value - 1);
  }
}

function handleTabClick(index: number) {
  activeTab.value = index;
}

export default App; 