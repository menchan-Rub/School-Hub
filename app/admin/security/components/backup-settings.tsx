import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { SecuritySettings } from "@/app/lib/types";

interface BackupSettingsProps {
  initialSettings?: SecuritySettings["backupSettings"];
}

export function BackupSettings({ initialSettings }: BackupSettingsProps) {
  const [settings, setSettings] = useState(initialSettings || {
    enableAutoBackup: true,
    backupSchedule: "daily" as const,
    backupTime: "00:00",
    retentionPeriod: 30,
    backupTypes: {
      database: true,
      files: true,
      configurations: true,
    },
    compressionEnabled: true,
    encryptionEnabled: true,
    storageLocation: "local" as const,
    notifyOnSuccess: true,
    notifyOnFailure: true,
  });

  const handleSave = async () => {
    try {
      // TODO: API呼び出しを実装
      console.log("Settings saved:", settings);
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  const handleBackupNow = async () => {
    try {
      // TODO: 手動バックアップの実行を実装
      console.log("Manual backup initiated");
    } catch (error) {
      console.error("Failed to start backup:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>バックアップ設定</CardTitle>
        <CardDescription>
          システムのバックアップスケジュールと保存設定を管理します。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="enableAutoBackup">自動バックアップを有効にする</Label>
          <Switch
            id="enableAutoBackup"
            checked={settings.enableAutoBackup}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, enableAutoBackup: checked })
            }
          />
        </div>

        {settings.enableAutoBackup && (
          <>
            <div className="space-y-2">
              <Label htmlFor="backupSchedule">バックアップスケジュール</Label>
              <Select
                value={settings.backupSchedule}
                onValueChange={(value) =>
                  setSettings({ ...settings, backupSchedule: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">毎時</SelectItem>
                  <SelectItem value="daily">毎日</SelectItem>
                  <SelectItem value="weekly">毎週</SelectItem>
                  <SelectItem value="monthly">毎月</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="backupTime">バックアップ実行時刻</Label>
              <Input
                id="backupTime"
                type="time"
                value={settings.backupTime}
                onChange={(e) =>
                  setSettings({ ...settings, backupTime: e.target.value })
                }
              />
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="retentionPeriod">保持期間（日数）</Label>
          <Input
            id="retentionPeriod"
            type="number"
            value={settings.retentionPeriod}
            onChange={(e) =>
              setSettings({
                ...settings,
                retentionPeriod: parseInt(e.target.value),
              })
            }
          />
        </div>

        <div className="space-y-2">
          <Label>バックアップ対象</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="database"
                checked={settings.backupTypes.database}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    backupTypes: {
                      ...settings.backupTypes,
                      database: checked as boolean,
                    },
                  })
                }
              />
              <Label htmlFor="database">データベース</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="files"
                checked={settings.backupTypes.files}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    backupTypes: {
                      ...settings.backupTypes,
                      files: checked as boolean,
                    },
                  })
                }
              />
              <Label htmlFor="files">ファイル</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="configurations"
                checked={settings.backupTypes.configurations}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    backupTypes: {
                      ...settings.backupTypes,
                      configurations: checked as boolean,
                    },
                  })
                }
              />
              <Label htmlFor="configurations">設定ファイル</Label>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="compressionEnabled">圧縮を有効にする</Label>
            <Switch
              id="compressionEnabled"
              checked={settings.compressionEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, compressionEnabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="encryptionEnabled">暗号化を有効にする</Label>
            <Switch
              id="encryptionEnabled"
              checked={settings.encryptionEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, encryptionEnabled: checked })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="storageLocation">保存先</Label>
          <Select
            value={settings.storageLocation}
            onValueChange={(value) =>
              setSettings({ ...settings, storageLocation: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="local">ローカルストレージ</SelectItem>
              <SelectItem value="s3">Amazon S3</SelectItem>
              <SelectItem value="gcs">Google Cloud Storage</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="notifyOnSuccess">
              バックアップ成功時に通知する
            </Label>
            <Switch
              id="notifyOnSuccess"
              checked={settings.notifyOnSuccess}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, notifyOnSuccess: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="notifyOnFailure">
              バックアップ失敗時に通知する
            </Label>
            <Switch
              id="notifyOnFailure"
              checked={settings.notifyOnFailure}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, notifyOnFailure: checked })
              }
            />
          </div>
        </div>

        <div className="flex space-x-2">
          <Button onClick={handleSave} className="flex-1">
            設定を保存
          </Button>
          <Button onClick={handleBackupNow} variant="outline">
            今すぐバックアップ
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 