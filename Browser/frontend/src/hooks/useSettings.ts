import { useState, useCallback, useEffect } from 'react';
import { useApi } from './useApi';

interface Setting {
  id: number;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

interface Settings {
  // 一般設定
  theme: 'light' | 'dark' | 'system';
  language: string;
  startupPage: string;
  searchEngine: string;
  
  // プライバシー設定
  clearHistoryOnExit: boolean;
  doNotTrack: boolean;
  blockThirdPartyCookies: boolean;
  
  // セキュリティ設定
  enableJavaScript: boolean;
  enablePlugins: boolean;
  enablePopups: boolean;
  
  // ダウンロード設定
  downloadPath: string;
  askBeforeDownload: boolean;
  
  // 表示設定
  fontSize: number;
  defaultZoom: number;
  showBookmarksBar: boolean;
  
  // 開発者設定
  enableDevTools: boolean;
  enableRemoteDebugging: boolean;
}

const defaultSettings: Settings = {
  theme: 'system',
  language: 'ja',
  startupPage: 'about:blank',
  searchEngine: 'https://www.google.com/search?q={query}',
  
  clearHistoryOnExit: false,
  doNotTrack: false,
  blockThirdPartyCookies: true,
  
  enableJavaScript: true,
  enablePlugins: false,
  enablePopups: false,
  
  downloadPath: '/downloads',
  askBeforeDownload: true,
  
  fontSize: 16,
  defaultZoom: 100,
  showBookmarksBar: true,
  
  enableDevTools: false,
  enableRemoteDebugging: false,
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const { data, loading, error, get, post } = useApi<Setting[]>();

  // 設定の読み込み
  const loadSettings = useCallback(async () => {
    try {
      const items = await get('/settings');
      const newSettings = { ...defaultSettings };
      items.forEach((item) => {
        try {
          (newSettings as any)[item.key] = JSON.parse(item.value);
        } catch {
          (newSettings as any)[item.key] = item.value;
        }
      });
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, [get]);

  // 初期設定の読み込み
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // 設定の更新
  const updateSetting = useCallback(async <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    try {
      await post('/settings', {
        key,
        value: JSON.stringify(value),
      });
      setSettings((prev) => ({
        ...prev,
        [key]: value,
      }));
    } catch (error) {
      console.error('Failed to update setting:', error);
      throw error;
    }
  }, [post]);

  // 設定の一括更新
  const updateSettings = useCallback(async (newSettings: Partial<Settings>) => {
    try {
      await Promise.all(
        Object.entries(newSettings).map(([key, value]) =>
          post('/settings', {
            key,
            value: JSON.stringify(value),
          })
        )
      );
      setSettings((prev) => ({
        ...prev,
        ...newSettings,
      }));
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  }, [post]);

  // 設定のリセット
  const resetSettings = useCallback(async () => {
    try {
      await post('/settings/reset', {});
      setSettings(defaultSettings);
    } catch (error) {
      console.error('Failed to reset settings:', error);
      throw error;
    }
  }, [post]);

  // 設定のエクスポート
  const exportSettings = useCallback(() => {
    const data = JSON.stringify(settings, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'browser-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [settings]);

  // 設定のインポート
  const importSettings = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const newSettings = JSON.parse(text);
      await updateSettings(newSettings);
    } catch (error) {
      console.error('Failed to import settings:', error);
      throw error;
    }
  }, [updateSettings]);

  return {
    settings,
    loading,
    error,
    updateSetting,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,
  };
} 