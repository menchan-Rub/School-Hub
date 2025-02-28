import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface PasswordPolicySettingsProps {
  initialSettings?: {
    minLength: number;
    maxLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
    expiryDays: number;
    historyCount: number;
    showStrengthMeter: boolean;
  };
}

export function PasswordPolicySettings({ initialSettings }: PasswordPolicySettingsProps) {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({
    minLength: initialSettings?.minLength ?? 8,
    maxLength: initialSettings?.maxLength ?? 32,
    requireUppercase: initialSettings?.requireUppercase ?? true,
    requireLowercase: initialSettings?.requireLowercase ?? true,
    requireNumbers: initialSettings?.requireNumbers ?? true,
    requireSymbols: initialSettings?.requireSymbols ?? true,
    expiryDays: initialSettings?.expiryDays ?? 90,
    historyCount: initialSettings?.historyCount ?? 5,
    showStrengthMeter: initialSettings?.showStrengthMeter ?? true,
  });

  const handleSave = async () => {
    try {
      const res = await fetch("/api/admin/security", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          passwordPolicy: settings,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save settings");
      }

      await queryClient.invalidateQueries({ queryKey: ["security-settings"] });
      toast.success("パスワードポリシー設定を保存しました");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("設定の保存に失敗しました");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>パスワードポリシー設定</CardTitle>
        <CardDescription>
          パスワードの要件と有効期限の設定を管理します。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="minLength">最小文字数</Label>
            <Input
              id="minLength"
              type="number"
              value={settings.minLength}
              onChange={(e) =>
                setSettings({ ...settings, minLength: parseInt(e.target.value) })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxLength">最大文字数</Label>
            <Input
              id="maxLength"
              type="number"
              value={settings.maxLength}
              onChange={(e) =>
                setSettings({ ...settings, maxLength: parseInt(e.target.value) })
              }
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="requireUppercase">大文字を必須にする</Label>
            <Switch
              id="requireUppercase"
              checked={settings.requireUppercase}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, requireUppercase: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="requireLowercase">小文字を必須にする</Label>
            <Switch
              id="requireLowercase"
              checked={settings.requireLowercase}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, requireLowercase: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="requireNumbers">数字を必須にする</Label>
            <Switch
              id="requireNumbers"
              checked={settings.requireNumbers}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, requireNumbers: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="requireSymbols">記号を必須にする</Label>
            <Switch
              id="requireSymbols"
              checked={settings.requireSymbols}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, requireSymbols: checked })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>パスワード有効期限（日数）</Label>
          <div className="flex items-center space-x-4">
            <Slider
              value={[settings.expiryDays]}
              onValueChange={(value) =>
                setSettings({ ...settings, expiryDays: value[0] })
              }
              max={365}
              step={1}
              className="flex-1"
            />
            <span className="w-12 text-right">{settings.expiryDays}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="historyCount">パスワード履歴保持数</Label>
          <Input
            id="historyCount"
            type="number"
            value={settings.historyCount}
            onChange={(e) =>
              setSettings({ ...settings, historyCount: parseInt(e.target.value) })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="showStrengthMeter">パスワード強度メーターを表示</Label>
          <Switch
            id="showStrengthMeter"
            checked={settings.showStrengthMeter}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, showStrengthMeter: checked })
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