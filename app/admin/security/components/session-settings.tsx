import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { SecuritySettings } from "@/app/lib/types";

interface SessionSettingsProps {
  initialSettings?: SecuritySettings["sessionSettings"];
}

export function SessionSettings({ initialSettings }: SessionSettingsProps) {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({
    sessionTimeout: initialSettings?.sessionTimeout ?? 30,
    timeoutUnit: initialSettings?.timeoutUnit ?? "minutes",
    idleTimeout: initialSettings?.idleTimeout ?? 15,
    idleTimeoutUnit: initialSettings?.idleTimeoutUnit ?? "minutes",
    maxConcurrentSessions: initialSettings?.maxConcurrentSessions ?? 3,
    forceLogoutOnPasswordChange: initialSettings?.forceLogoutOnPasswordChange ?? true,
    forceLogoutOnRoleChange: initialSettings?.forceLogoutOnRoleChange ?? true,
    enableSessionMonitoring: initialSettings?.enableSessionMonitoring ?? true,
  });

  const handleSave = async () => {
    try {
      const res = await fetch("/api/admin/security", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionSettings: settings,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save settings");
      }

      await queryClient.invalidateQueries({ queryKey: ["security-settings"] });
      toast.success("セッション設定を保存しました");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("設定の保存に失敗しました");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>セッション設定</CardTitle>
        <CardDescription>
          セッションのタイムアウトと管理設定を行います。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sessionTimeout">セッションタイムアウト</Label>
            <Input
              id="sessionTimeout"
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  sessionTimeout: parseInt(e.target.value),
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timeoutUnit">時間単位</Label>
            <Select
              value={settings.timeoutUnit}
              onValueChange={(value) =>
                setSettings({ ...settings, timeoutUnit: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minutes">分</SelectItem>
                <SelectItem value="hours">時間</SelectItem>
                <SelectItem value="days">日</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="idleTimeout">アイドルタイムアウト</Label>
            <Input
              id="idleTimeout"
              type="number"
              value={settings.idleTimeout}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  idleTimeout: parseInt(e.target.value),
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="idleTimeoutUnit">時間単位</Label>
            <Select
              value={settings.idleTimeoutUnit}
              onValueChange={(value) =>
                setSettings({ ...settings, idleTimeoutUnit: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minutes">分</SelectItem>
                <SelectItem value="hours">時間</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxConcurrentSessions">
            最大同時セッション数
          </Label>
          <Input
            id="maxConcurrentSessions"
            type="number"
            value={settings.maxConcurrentSessions}
            onChange={(e) =>
              setSettings({
                ...settings,
                maxConcurrentSessions: parseInt(e.target.value),
              })
            }
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="forceLogoutOnPasswordChange">
              パスワード変更時に強制ログアウト
            </Label>
            <Switch
              id="forceLogoutOnPasswordChange"
              checked={settings.forceLogoutOnPasswordChange}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  forceLogoutOnPasswordChange: checked,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="forceLogoutOnRoleChange">
              権限変更時に強制ログアウト
            </Label>
            <Switch
              id="forceLogoutOnRoleChange"
              checked={settings.forceLogoutOnRoleChange}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  forceLogoutOnRoleChange: checked,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="enableSessionMonitoring">
              セッションモニタリングを有効化
            </Label>
            <Switch
              id="enableSessionMonitoring"
              checked={settings.enableSessionMonitoring}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  enableSessionMonitoring: checked,
                })
              }
            />
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          設定を保存
        </Button>
      </CardContent>
    </Card>
  );
} 