import { useState, useCallback } from 'react';
import { api } from '../utils/api';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface ApiResponse<T> {
  data: T;
  status: number;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export function useApi<T>(initialData: T | null = null) {
  const [state, setState] = useState<ApiState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  const request = useCallback(async (method: string, url: string, data?: any) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await api.request({
        method,
        url,
        data,
      }) as ApiResponse<T>;
      setState({ data: response.data, loading: false, error: null });
      return response.data;
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: error as Error }));
      throw error;
    }
  }, []);

  const get = useCallback(
    (url: string) => request('GET', url),
    [request]
  );

  const post = useCallback(
    (url: string, data: any) => request('POST', url, data),
    [request]
  );

  const put = useCallback(
    (url: string, data: any) => request('PUT', url, data),
    [request]
  );

  const del = useCallback(
    (url: string) => request('DELETE', url),
    [request]
  );

  return {
    ...state,
    get,
    post,
    put,
    delete: del,
  };
}

export function useAuth() {
  const { post } = useApi<AuthResponse>();

  const login = useCallback(
    async (username: string, password: string) => {
      const response = await post('/token', { username, password });
      localStorage.setItem('token', response.access_token);
      return response;
    },
    [post]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('token');
  }, []);

  const register = useCallback(
    async (username: string, password: string) => {
      return await post('/users', { username, password });
    },
    [post]
  );

  return { login, logout, register };
}

export function useHistory() {
  const { data: history, loading, error, get, post, delete: del } = useApi<any[]>();

  const fetchHistory = useCallback(async () => {
    return await get('/history');
  }, [get]);

  const addHistory = useCallback(
    async (url: string, title: string) => {
      return await post('/history', { url, title });
    },
    [post]
  );

  const deleteHistory = useCallback(
    async (id: number) => {
      return await del(`/history/${id}`);
    },
    [del]
  );

  return {
    history,
    loading,
    error,
    fetchHistory,
    addHistory,
    deleteHistory,
  };
}

export function useBookmarks() {
  const { data: bookmarks, loading, error, get, post, put, delete: del } = useApi<any[]>();

  const fetchBookmarks = useCallback(async () => {
    return await get('/bookmarks');
  }, [get]);

  const addBookmark = useCallback(
    async (url: string, title: string, description?: string, folderId?: number) => {
      return await post('/bookmarks', { url, title, description, folderId });
    },
    [post]
  );

  const updateBookmark = useCallback(
    async (id: number, data: any) => {
      return await put(`/bookmarks/${id}`, data);
    },
    [put]
  );

  const deleteBookmark = useCallback(
    async (id: number) => {
      return await del(`/bookmarks/${id}`);
    },
    [del]
  );

  return {
    bookmarks,
    loading,
    error,
    fetchBookmarks,
    addBookmark,
    updateBookmark,
    deleteBookmark,
  };
}

export function useSettings() {
  const { data: settings, loading, error, get, post } = useApi<Record<string, any>>();

  const fetchSettings = useCallback(async () => {
    return await get('/settings');
  }, [get]);

  const updateSetting = useCallback(
    async (key: string, value: any) => {
      return await post('/settings', { key, value });
    },
    [post]
  );

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSetting,
  };
}

export function useDownloads() {
  const { data: downloads, loading, error, get, post, delete: del } = useApi<any[]>();

  const fetchDownloads = useCallback(async () => {
    return await get('/downloads');
  }, [get]);

  const startDownload = useCallback(
    async (url: string, filename: string) => {
      return await post('/downloads', { url, filename });
    },
    [post]
  );

  const cancelDownload = useCallback(
    async (id: number) => {
      return await del(`/downloads/${id}`);
    },
    [del]
  );

  return {
    downloads,
    loading,
    error,
    fetchDownloads,
    startDownload,
    cancelDownload,
  };
} 