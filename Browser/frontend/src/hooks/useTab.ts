import { useState, useCallback, useEffect } from 'react';
import { useApi } from './useApi';
import { useTabEvents } from './useWebSocket';
import { webSocket } from '../utils/websocket';
import { pageCache, resourceCache } from '../utils/cache';
import { performanceMonitor } from '../utils/performance';

interface Tab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TabEvent {
  type: 'TAB_CREATED' | 'TAB_CLOSED' | 'URL_CHANGED' | 'TITLE_CHANGED' | 'FAVICON_CHANGED' | 'LOADING_STATE_CHANGED';
  tab?: Tab;
  tabId?: string;
  url?: string;
  title?: string;
  favicon?: string;
  isLoading?: boolean;
}

export function useTabs() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const { data, loading, error, get, post, delete: del } = useApi<Tab[]>();
  const { navigate, createTab, closeTab } = useTabEvents();

  // WebSocketイベントの処理
  const handleTabUpdate = useCallback((event: { type: string } & TabEvent) => {
    switch (event.type) {
      case 'TAB_CREATED':
        if (event.tab) {
          setTabs(prev => [...prev, event.tab as Tab]);
          if (event.tab.isActive) {
            setActiveTabId(event.tab.id);
          }
        }
        break;

      case 'TAB_CLOSED':
        if (event.tabId) {
          setTabs(prev => {
            const index = prev.findIndex(tab => tab.id === event.tabId);
            if (index === -1) return prev;

            const newTabs = prev.filter(tab => tab.id !== event.tabId);
            if (prev[index].isActive && newTabs.length > 0) {
              const newActiveIndex = Math.min(index, newTabs.length - 1);
              newTabs[newActiveIndex].isActive = true;
              setActiveTabId(newTabs[newActiveIndex].id);
            }
            return newTabs;
          });
        }
        break;

      case 'URL_CHANGED':
        if (event.tabId && event.url) {
          setTabs(prev =>
            prev.map(tab =>
              tab.id === event.tabId
                ? { ...tab, url: event.url!, isLoading: true }
                : tab
            )
          );
        }
        break;

      case 'TITLE_CHANGED':
        if (event.tabId && event.title) {
          setTabs(prev =>
            prev.map(tab =>
              tab.id === event.tabId
                ? { ...tab, title: event.title! }
                : tab
            )
          );
        }
        break;

      case 'FAVICON_CHANGED':
        if (event.tabId && event.favicon) {
          setTabs(prev =>
            prev.map(tab =>
              tab.id === event.tabId
                ? { ...tab, favicon: event.favicon }
                : tab
            )
          );
        }
        break;

      case 'LOADING_STATE_CHANGED':
        if (event.tabId && event.isLoading !== undefined) {
          setTabs(prev =>
            prev.map(tab =>
              tab.id === event.tabId
                ? { ...tab, isLoading: event.isLoading! }
                : tab
            )
          );
        }
        break;
    }
  }, []);

  // WebSocketイベントの購読
  useEffect(() => {
    const eventTypes = {
      TAB_CREATED: (data: any) => handleTabUpdate({ type: 'TAB_CREATED', ...data }),
      TAB_CLOSED: (data: any) => handleTabUpdate({ type: 'TAB_CLOSED', ...data }),
      URL_CHANGED: (data: any) => handleTabUpdate({ type: 'URL_CHANGED', ...data }),
      TITLE_CHANGED: (data: any) => handleTabUpdate({ type: 'TITLE_CHANGED', ...data }),
      FAVICON_CHANGED: (data: any) => handleTabUpdate({ type: 'FAVICON_CHANGED', ...data }),
      LOADING_STATE_CHANGED: (data: any) => handleTabUpdate({ type: 'LOADING_STATE_CHANGED', ...data }),
    };

    Object.entries(eventTypes).forEach(([type, handler]) => {
      webSocket.subscribe(type, handler);
    });

    return () => {
      Object.entries(eventTypes).forEach(([type, handler]) => {
        webSocket.unsubscribe(type, handler);
      });
    };
  }, [handleTabUpdate]);

  // タブ一覧の取得
  const fetchTabs = useCallback(async () => {
    try {
      const items = await get('/tabs');
      setTabs(items);
      const activeTab = items.find((tab: Tab) => tab.isActive);
      if (activeTab) {
        setActiveTabId(activeTab.id);
      }
    } catch (error) {
      console.error('Failed to fetch tabs:', error);
    }
  }, [get]);

  // 初期データの取得
  useEffect(() => {
    fetchTabs();
  }, [fetchTabs]);

  // タブの作成
  const addTab = useCallback(async (url?: string) => {
    try {
      const cachedPage = url ? pageCache.get(url) : undefined;
      if (cachedPage) {
        const tab = await post('/tabs', { url, content: cachedPage });
        createTab(url);
        setTabs(prev => [...prev, tab]);
        setActiveTabId(tab.id);
        return tab;
      }

      const tab = await post('/tabs', { url });
      createTab(url || '');
      setTabs(prev => [...prev, tab]);
      setActiveTabId(tab.id);

      // パフォーマンス計測開始
      performanceMonitor.measurePageLoad();

      return tab;
    } catch (error) {
      console.error('Failed to create tab:', error);
      throw error;
    }
  }, [post, createTab]);

  // タブの削除
  const removeTab = useCallback(async (id: string) => {
    try {
      await del(`/tabs/${id}`);
      closeTab(id);
      setTabs(prev => {
        const index = prev.findIndex(tab => tab.id === id);
        if (index === -1) return prev;

        const newTabs = prev.filter(tab => tab.id !== id);
        if (prev[index].isActive && newTabs.length > 0) {
          const newActiveIndex = Math.min(index, newTabs.length - 1);
          newTabs[newActiveIndex].isActive = true;
          setActiveTabId(newTabs[newActiveIndex].id);
        }
        return newTabs;
      });
    } catch (error) {
      console.error('Failed to close tab:', error);
      throw error;
    }
  }, [del, closeTab]);

  // タブのURLを変更
  const navigateTab = useCallback(async (id: string, url: string) => {
    try {
      const cachedPage = pageCache.get(url);
      if (cachedPage) {
        await post(`/tabs/${id}/navigate`, { url, content: cachedPage });
        navigate(url);
        setTabs(prev =>
          prev.map(tab =>
            tab.id === id
              ? { ...tab, url, isLoading: false }
              : tab
          )
        );
        return;
      }

      await post(`/tabs/${id}/navigate`, { url });
      navigate(url);
      setTabs(prev =>
        prev.map(tab =>
          tab.id === id
            ? { ...tab, url, isLoading: true }
            : tab
        )
      );

      // パフォーマンス計測開始
      performanceMonitor.measurePageLoad();
    } catch (error) {
      console.error('Failed to navigate tab:', error);
      throw error;
    }
  }, [post, navigate]);

  // アクティブタブの変更
  const activateTab = useCallback(async (id: string) => {
    try {
      await post(`/tabs/${id}/activate`, {});
      setTabs(prev =>
        prev.map(tab => ({
          ...tab,
          isActive: tab.id === id,
        }))
      );
      setActiveTabId(id);
    } catch (error) {
      console.error('Failed to activate tab:', error);
      throw error;
    }
  }, [post]);

  // タブの再読み込み
  const reloadTab = useCallback(async (id: string) => {
    try {
      await post(`/tabs/${id}/reload`, {});
      setTabs(prev =>
        prev.map(tab =>
          tab.id === id
            ? { ...tab, isLoading: true }
            : tab
        )
      );
    } catch (error) {
      console.error('Failed to reload tab:', error);
      throw error;
    }
  }, [post]);

  // タブの並び替え
  const reorderTabs = useCallback(async (fromIndex: number, toIndex: number) => {
    try {
      await post('/tabs/reorder', { fromIndex, toIndex });
      setTabs(prev => {
        const newTabs = [...prev];
        const [movedTab] = newTabs.splice(fromIndex, 1);
        newTabs.splice(toIndex, 0, movedTab);
        return newTabs;
      });
    } catch (error) {
      console.error('Failed to reorder tabs:', error);
      throw error;
    }
  }, [post]);

  return {
    tabs,
    activeTabId,
    loading,
    error,
    fetchTabs,
    addTab,
    removeTab,
    navigateTab,
    activateTab,
    reloadTab,
    reorderTabs,
    getPerformanceMetrics: performanceMonitor.getAverageMetrics.bind(performanceMonitor),
  };
} 