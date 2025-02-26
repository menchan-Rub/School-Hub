import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import '../styles/Settings.scss';

interface Settings {
  theme: {
    mode: 'light' | 'dark' | 'system';
  };
  'search.engine': string;
  'downloads.location': string;
  'privacy.doNotTrack': boolean;
  'security.webrtc': string;
  'performance.hardware_acceleration': boolean;
  language: string;
}

interface SettingsProps {
  path: string;
}

export function Settings(props: SettingsProps) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      setError('設定の読み込みに失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (key: keyof Settings, value: any) => {
    if (!settings) return;

    try {
      const response = await fetch(`http://localhost:3000/api/settings/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value }),
      });

      if (!response.ok) throw new Error('Failed to update setting');

      setSettings({
        ...settings,
        [key]: value,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError('設定の更新に失敗しました');
      console.error(err);
    }
  };

  const handleReset = async () => {
    if (!confirm('設定を初期化しますか？')) return;

    try {
      const response = await fetch('http://localhost:3000/api/settings/initialize', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to reset settings');
      await fetchSettings();
    } catch (err) {
      setError('設定の初期化に失敗しました');
      console.error(err);
    }
  };

  if (loading) return <div className="loading">読み込み中...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!settings) return null;

  return (
    <div className="settings">
      <div className="settings-header">
        <h1>設定</h1>
        {saved && <span className="saved-indicator">✓ 保存しました</span>}
        <button className="reset-button" onClick={handleReset}>
          初期化
        </button>
      </div>

      <div className="settings-section">
        <h2>外観</h2>
        <div className="setting-item">
          <label>テーマ</label>
          <select
            value={settings.theme.mode}
            onChange={(e) => handleSettingChange('theme', { mode: e.currentTarget.value })}
          >
            <option value="light">ライト</option>
            <option value="dark">ダーク</option>
            <option value="system">システム設定に従う</option>
          </select>
        </div>
      </div>

      <div className="settings-section">
        <h2>検索</h2>
        <div className="setting-item">
          <label>検索エンジン</label>
          <input
            type="text"
            value={settings['search.engine']}
            onChange={(e) => handleSettingChange('search.engine', e.currentTarget.value)}
            placeholder="https://example.com/search?q={searchTerms}"
          />
        </div>
      </div>

      <div className="settings-section">
        <h2>ダウンロード</h2>
        <div className="setting-item">
          <label>保存場所</label>
          <input
            type="text"
            value={settings['downloads.location']}
            onChange={(e) => handleSettingChange('downloads.location', e.currentTarget.value)}
          />
        </div>
      </div>

      <div className="settings-section">
        <h2>プライバシーとセキュリティ</h2>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings['privacy.doNotTrack']}
              onChange={(e) => handleSettingChange('privacy.doNotTrack', e.currentTarget.checked)}
            />
            トラッキング拒否を要求
          </label>
        </div>
        <div className="setting-item">
          <label>WebRTC IPハンドリング</label>
          <select
            value={settings['security.webrtc']}
            onChange={(e) => handleSettingChange('security.webrtc', e.currentTarget.value)}
          >
            <option value="default">デフォルト</option>
            <option value="default_public_interface_only">パブリックインターフェースのみ</option>
            <option value="disable_non_proxied_udp">プロキシ経由のUDPのみ</option>
          </select>
        </div>
      </div>

      <div className="settings-section">
        <h2>パフォーマンス</h2>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings['performance.hardware_acceleration']}
              onChange={(e) => handleSettingChange('performance.hardware_acceleration', e.currentTarget.checked)}
            />
            ハードウェアアクセラレーションを使用
          </label>
        </div>
      </div>

      <div className="settings-section">
        <h2>言語</h2>
        <div className="setting-item">
          <label>表示言語</label>
          <select
            value={settings.language}
            onChange={(e) => handleSettingChange('language', e.currentTarget.value)}
          >
            <option value="ja">日本語</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default Settings; 