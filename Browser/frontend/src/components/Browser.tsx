import React, { useState, useCallback } from 'react';
import { Tab } from './Tab';
import { AddressBar } from './AddressBar';
import styles from '../styles/components/Browser.module.scss';

interface TabData {
  id: string;
  title: string;
  url: string;
  favicon?: string;
}

export const Browser: React.FC = () => {
  const [tabs, setTabs] = useState<TabData[]>([
    { id: '1', title: '新しいタブ', url: 'about:blank' }
  ]);
  const [activeTabId, setActiveTabId] = useState('1');

  const handleNewTab = useCallback(() => {
    const newTab: TabData = {
      id: Date.now().toString(),
      title: '新しいタブ',
      url: 'about:blank'
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, []);

  const handleCloseTab = useCallback((tabId: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(tab => tab.id !== tabId);
      if (newTabs.length === 0) {
        handleNewTab();
        return newTabs;
      }
      if (tabId === activeTabId) {
        const index = prev.findIndex(tab => tab.id === tabId);
        const newActiveId = prev[index - 1]?.id || prev[index + 1]?.id;
        setActiveTabId(newActiveId);
      }
      return newTabs;
    });
  }, [activeTabId, handleNewTab]);

  const handleNavigate = useCallback((url: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId
        ? { ...tab, url, title: url }
        : tab
    ));
  }, [activeTabId]);

  const handleTabClick = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  return (
    <div className={styles.browser}>
      <div className={styles.tabBar}>
        <div className={styles.tabs}>
          {tabs.map(tab => (
            <Tab
              key={tab.id}
              title={tab.title}
              url={tab.url}
              favicon={tab.favicon}
              isActive={tab.id === activeTabId}
              onClose={() => handleCloseTab(tab.id)}
              onClick={() => handleTabClick(tab.id)}
            />
          ))}
        </div>
        <button
          className={styles.newTabButton}
          onClick={handleNewTab}
          title="新しいタブ"
        >
          +
        </button>
      </div>
      <AddressBar
        initialUrl={activeTab?.url}
        onNavigate={handleNavigate}
      />
      <div className={styles.content}>
        {/* ここにCEFのブラウザビューを表示 */}
      </div>
    </div>
  );
}; 