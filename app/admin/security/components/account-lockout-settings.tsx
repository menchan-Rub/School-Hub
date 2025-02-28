import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface AccountLockoutSettingsProps {
  initialSettings?: {
    maxLoginAttempts: number;
    lockoutDuration: number;
    lockoutDurationType: "minutes" | "hours" | "days";
    autoUnlock: boolean;
    notifyAdmin: boolean;
  };
}

export function AccountLockoutSettings({ initialSettings }: AccountLockoutSettingsProps) {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({
    maxLoginAttempts: initialSettings?.maxLoginAttempts ?? 5,
    lockoutDuration: initialSettings?.lockoutDuration ?? 30,
    lockoutDurationType: initialSettings?.lockoutDurationType ?? "minutes",
    autoUnlock: initialSettings?.autoUnlock ?? true,
    notifyAdmin: initialSettings?.notifyAdmin ?? true,
  });

  const handleSave = async () => {
    try {
      const res = await fetch("/api/admin/security", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountLockout: settings,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save settings");
      }

      await queryClient.invalidateQueries({ queryKey: ["security-settings"] });
      toast.success("アカウントロックアウト設定を保存しました");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("設定の保存に失敗しました");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>アカウントロックアウト設定</CardTitle>
        <CardDescription>
          ログイン試行の制限とアカウントロックアウトの設定を管理します。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="maxLoginAttempts">最大ログイン試行回数</Label>
          <Input
            id="maxLoginAttempts"
            type="number"
            value={settings.maxLoginAttempts}
            onChange={(e) =>
              setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) })
            }
          />
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="lockoutDuration">ロックアウト期間</Label>
            <Input
              id="lockoutDuration"
              type="number"
              value={settings.lockoutDuration}
              onChange={(e) =>
                setSettings({ ...settings, lockoutDuration: parseInt(e.target.value) })
              }
            />
          </div>
          <div className="flex-1 space-y-2">
            <Label htmlFor="lockoutDurationType">期間単位</Label>
            <Select
              value={settings.lockoutDurationType}
              onValueChange={(value) =>
                setSettings({ ...settings, lockoutDurationType: value })
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

        <div className="flex items-center justify-between">
          <Label htmlFor="autoUnlock">自動ロック解除を有効にする</Label>
          <Switch
            id="autoUnlock"
            checked={settings.autoUnlock}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, autoUnlock: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="notifyAdmin">管理者に通知する</Label>
          <Switch
            id="notifyAdmin"
            checked={settings.notifyAdmin}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, notifyAdmin: checked })
            }
          />
        </div>

        <Button onClick={handleSave} className="w-full">
          設定を保存
        </Button>
      </CardContent>
    </Card>
  );
} 