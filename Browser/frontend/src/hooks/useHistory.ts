import { useState, useCallback, useEffect } from 'react';
import { useApi } from './useApi';

interface HistoryItem {
  id: number;
  url: string;
  title: string;
  visitCount: number;
  lastVisitTime: string;
  createdAt: string;
}

interface HistoryGroup {
  date: string;
  items: HistoryItem[];
}

export function useHistory() {
  const [groups, setGroups] = useState<HistoryGroup[]>([]);
  const { data: history, loading, error, get, post, delete: del } = useApi<HistoryItem[]>();

  // 履歴アイテムを日付でグループ化
  const groupByDate = useCallback((items: HistoryItem[]) => {
    const groups: Record<string, HistoryItem[]> = {};
    
    items.forEach((item) => {
      const date = new Date(item.lastVisitTime).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
    });

    return Object.entries(groups)
      .map(([date, items]) => ({
        date,
        items: items.sort((a, b) => 
          new Date(b.lastVisitTime).getTime() - new Date(a.lastVisitTime).getTime()
        ),
      }))
      .sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
  }, []);

  // データの取得
  const fetchHistory = useCallback(async () => {
    try {
      const items = await get('/history');
      setGroups(groupByDate(items));
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  }, [get, groupByDate]);

  // 初期データの取得
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // 履歴の追加
  const addHistory = useCallback(async (url: string, title: string) => {
    try {
      const item = await post('/history', { url, title });
      setGroups((prev) => {
        const date = new Date(item.lastVisitTime).toLocaleDateString();
        const existingGroup = prev.find((g) => g.date === date);

        if (existingGroup) {
          const updatedGroup = {
            ...existingGroup,
            items: [item, ...existingGroup.items],
          };
          return prev.map((g) => (g.date === date ? updatedGroup : g));
        } else {
          return [{ date, items: [item] }, ...prev];
        }
      });
      return item;
    } catch (error) {
      console.error('Failed to add history:', error);
      throw error;
    }
  }, [post]);

  // 履歴の削除
  const deleteHistory = useCallback(async (id: number) => {
    try {
      await del(`/history/${id}`);
      setGroups((prev) =>
        prev.map((group) => ({
          ...group,
          items: group.items.filter((item) => item.id !== id),
        })).filter((group) => group.items.length > 0)
      );
    } catch (error) {
      console.error('Failed to delete history:', error);
      throw error;
    }
  }, [del]);

  // 履歴の検索
  const searchHistory = useCallback(async (query: string) => {
    try {
      const items = await get(`/history/search?q=${encodeURIComponent(query)}`);
      setGroups(groupByDate(items));
    } catch (error) {
      console.error('Failed to search history:', error);
      throw error;
    }
  }, [get, groupByDate]);

  // 履歴の一括削除
  const clearHistory = useCallback(async (fromDate?: Date, toDate?: Date) => {
    try {
      const params = new URLSearchParams();
      if (fromDate) {
        params.append('from', fromDate.toISOString());
      }
      if (toDate) {
        params.append('to', toDate.toISOString());
      }
      await del(`/history?${params.toString()}`);
      await fetchHistory();
    } catch (error) {
      console.error('Failed to clear history:', error);
      throw error;
    }
  }, [del, fetchHistory]);

  return {
    groups,
    loading,
    error,
    fetchHistory,
    addHistory,
    deleteHistory,
    searchHistory,
    clearHistory,
  };
} 