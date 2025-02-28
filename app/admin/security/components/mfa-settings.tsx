import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { SecuritySettings } from "@/app/lib/types";

interface MFASettingsProps {
  initialSettings?: SecuritySettings["mfaSettings"];
}

export function MFASettings({ initialSettings }: MFASettingsProps) {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({
    requireMFA: initialSettings?.requireMFA ?? false,
    allowedMethods: initialSettings?.allowedMethods ?? ["authenticator", "sms", "email"],
    backupCodesCount: initialSettings?.backupCodesCount ?? 10,
    mfaGracePeriod: initialSettings?.mfaGracePeriod ?? 7,
    rememberDevice: initialSettings?.rememberDevice ?? true,
    rememberDeviceDuration: initialSettings?.rememberDeviceDuration ?? 30,
  });

  const handleSave = async () => {
    try {
      const res = await fetch("/api/admin/security", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mfaSettings: settings,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save settings");
      }

      await queryClient.invalidateQueries({ queryKey: ["security-settings"] });
      toast.success("MFA設定を保存しました");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("設定の保存に失敗しました");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>多要素認証（MFA）設定</CardTitle>
        <CardDescription>
          多要素認証の要件と方法を管理します。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="requireMFA">MFAを必須にする</Label>
          <Switch
            id="requireMFA"
            checked={settings.requireMFA}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, requireMFA: checked })
            }
          />
        </div>

        <div className="space-y-2">
          <Label>許可するMFA方式</Label>
          <div className="space-y-2">
            {["authenticator", "sms", "email"].map((method) => (
              <div key={method} className="flex items-center justify-between">
                <Label htmlFor={`mfa-${method}`}>
                  {method === "authenticator"
                    ? "認証アプリ"
                    : method === "sms"
                    ? "SMS"
                    : "メール"}
                </Label>
                <Switch
                  id={`mfa-${method}`}
                  checked={settings.allowedMethods.includes(method)}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      allowedMethods: checked
                        ? [...settings.allowedMethods, method]
                        : settings.allowedMethods.filter((m) => m !== method),
                    })
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="backupCodesCount">バックアップコード生成数</Label>
          <Input
            id="backupCodesCount"
            type="number"
            value={settings.backupCodesCount}
            onChange={(e) =>
              setSettings({
                ...settings,
                backupCodesCount: parseInt(e.target.value),
              })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mfaGracePeriod">MFA設定猶予期間（日）</Label>
          <Input
            id="mfaGracePeriod"
            type="number"
            value={settings.mfaGracePeriod}
            onChange={(e) =>
              setSettings({
                ...settings,
                mfaGracePeriod: parseInt(e.target.value),
              })
            }
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="rememberDevice">デバイスを記憶する</Label>
            <Switch
              id="rememberDevice"
              checked={settings.rememberDevice}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, rememberDevice: checked })
              }
            />
          </div>

          {settings.rememberDevice && (
            <div className="space-y-2">
              <Label htmlFor="rememberDeviceDuration">
                デバイス記憶期間（日）
              </Label>
              <Input
                id="rememberDeviceDuration"
                type="number"
                value={settings.rememberDeviceDuration}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    rememberDeviceDuration: parseInt(e.target.value),
                  })
                }
              />
            </div>
          )}
        </div>

        <Button onClick={handleSave} className="w-full">
          設定を保存
        </Button>
      </CardContent>
    </Card>
  );
} 