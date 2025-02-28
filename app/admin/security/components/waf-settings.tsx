import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { SecuritySettings } from "@/app/lib/types";

interface WAFSettingsProps {
  initialSettings?: SecuritySettings["wafSettings"];
}

export function WAFSettings({ initialSettings }: WAFSettingsProps) {
  const [settings, setSettings] = useState(initialSettings || {
    enableWAF: false,
    mode: "detection" as const,
    rules: [
      {
        id: "sql-injection",
        name: "SQLインジェクション対策",
        enabled: true,
        priority: 1,
      },
      {
        id: "xss",
        name: "クロスサイトスクリプティング対策",
        enabled: true,
        priority: 2,
      },
      {
        id: "csrf",
        name: "CSRF対策",
        enabled: true,
        priority: 3,
      },
    ],
    customRules: [],
    logLevel: "info" as const,
    alertThreshold: 10,
  });

  const [newRule, setNewRule] = useState({
    pattern: "",
    action: "block",
    description: "",
  });

  const handleSave = async () => {
    try {
      // TODO: API呼び出しを実装
      console.log("Settings saved:", settings);
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  const handleAddCustomRule = () => {
    if (newRule.pattern && newRule.description) {
      setSettings({
        ...settings,
        customRules: [
          ...settings.customRules,
          {
            id: `custom-${settings.customRules.length + 1}`,
            ...newRule,
          },
        ],
      });
      setNewRule({
        pattern: "",
        action: "block",
        description: "",
      });
    }
  };

  const handleRemoveCustomRule = (id: string) => {
    setSettings({
      ...settings,
      customRules: settings.customRules.filter((rule) => rule.id !== id),
    });
  };

  const handleToggleRule = (id: string) => {
    setSettings({
      ...settings,
      rules: settings.rules.map((rule) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      ),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>WAF設定</CardTitle>
        <CardDescription>
          Webアプリケーションファイアウォールの設定を管理します。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="enableWAF">WAFを有効にする</Label>
          <Switch
            id="enableWAF"
            checked={settings.enableWAF}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, enableWAF: checked })
            }
          />
        </div>

        {settings.enableWAF && (
          <>
            <div className="space-y-2">
              <Label htmlFor="mode">動作モード</Label>
              <Select
                value={settings.mode}
                onValueChange={(value) =>
                  setSettings({ ...settings, mode: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="detection">検知モード</SelectItem>
                  <SelectItem value="prevention">防御モード</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>基本ルール設定</Label>
              <div className="space-y-2">
                {settings.rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div className="flex items-center space-x-2">
                      <span>{rule.name}</span>
                      <Badge variant={rule.enabled ? "default" : "secondary"}>
                        優先度: {rule.priority}
                      </Badge>
                    </div>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={() => handleToggleRule(rule.id)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>カスタムルール</Label>
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pattern">パターン（正規表現）</Label>
                    <Input
                      id="pattern"
                      value={newRule.pattern}
                      onChange={(e) =>
                        setNewRule({ ...newRule, pattern: e.target.value })
                      }
                      placeholder="^/api/.*"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="action">アクション</Label>
                    <Select
                      value={newRule.action}
                      onValueChange={(value) =>
                        setNewRule({ ...newRule, action: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="block">ブロック</SelectItem>
                        <SelectItem value="allow">許可</SelectItem>
                        <SelectItem value="log">ログのみ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">説明</Label>
                    <Input
                      id="description"
                      value={newRule.description}
                      onChange={(e) =>
                        setNewRule({ ...newRule, description: e.target.value })
                      }
                      placeholder="ルールの説明"
                    />
                  </div>
                  <Button onClick={handleAddCustomRule}>ルールを追加</Button>
                </div>

                <div className="space-y-2">
                  {settings.customRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{rule.description}</span>
                          <Badge>{rule.action}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {rule.pattern}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveCustomRule(rule.id)}
                        className="hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logLevel">ログレベル</Label>
              <Select
                value={settings.logLevel}
                onValueChange={(value) =>
                  setSettings({ ...settings, logLevel: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debug">デバッグ</SelectItem>
                  <SelectItem value="info">情報</SelectItem>
                  <SelectItem value="warn">警告</SelectItem>
                  <SelectItem value="error">エラー</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alertThreshold">
                アラート通知しきい値（分あたりの検知数）
              </Label>
              <Input
                id="alertThreshold"
                type="number"
                value={settings.alertThreshold}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    alertThreshold: parseInt(e.target.value),
                  })
                }
              />
            </div>
          </>
        )}

        <Button onClick={handleSave} className="w-full">
          設定を保存
        </Button>
      </CardContent>
    </Card>
  );
} 