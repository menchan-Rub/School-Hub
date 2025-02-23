'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface HistoryItem {
  id: string;
  url: string;
  title: string;
  timestamp: string;
  deviceInfo: {
    browser: string;
    os: string;
    ip: string;
  };
}

interface Props {
  userId: string;
}

export function UserBrowserHistory({ userId }: Props) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchHistory();
  }, [userId, page]);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/browser/history/${userId}?page=${page}`);
      const data = await res.json();
      setHistory(data.history);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('履歴の取得に失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteHistory = async (historyId: string) => {
    if (!confirm('この履歴を削除してもよろしいですか？')) return;
    
    try {
      await fetch(`/api/browser/history/${historyId}`, {
        method: 'DELETE'
      });
      fetchHistory();
    } catch (error) {
      console.error('履歴の削除に失敗:', error);
    }
  };

  if (loading) return <div>読み込み中...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">ブラウザ履歴</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                日時
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                タイトル
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                URL
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                デバイス情報
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {history.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(item.timestamp), 'PPP HH:mm', { locale: ja })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.url}
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.deviceInfo.browser} / {item.deviceInfo.os}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => deleteHistory(item.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            前へ
          </button>
          <span className="px-4 py-2">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            次へ
          </button>
        </div>
      )}
    </div>
  );
} 