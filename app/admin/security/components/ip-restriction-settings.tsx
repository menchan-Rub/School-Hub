import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { SecuritySettings } from "@/app/lib/types";

interface IPRestrictionSettingsProps {
  initialSettings?: SecuritySettings["ipRestriction"];
}

export function IPRestrictionSettings({ initialSettings }: IPRestrictionSettingsProps) {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({
    enableIPRestriction: initialSettings?.enableIPRestriction ?? false,
    allowedIPs: initialSettings?.allowedIPs ?? ["192.168.1.0/24", "10.0.0.0/8"],
    newIP: "",
    blockUnknownIPs: initialSettings?.blockUnknownIPs ?? true,
    notifyOnBlock: initialSettings?.notifyOnBlock ?? true,
    logBlockedAttempts: initialSettings?.logBlockedAttempts ?? true,
  });

  const handleAddIP = () => {
    if (settings.newIP && !settings.allowedIPs.includes(settings.newIP)) {
      setSettings({
        ...settings,
        allowedIPs: [...settings.allowedIPs, settings.newIP],
        newIP: "",
      });
    }
  };

  const handleRemoveIP = (ip: string) => {
    setSettings({
      ...settings,
      allowedIPs: settings.allowedIPs.filter((allowedIP) => allowedIP !== ip),
    });
  };

  const handleSave = async () => {
    try {
      const { newIP, ...settingsToSave } = settings;
      const res = await fetch("/api/admin/security", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ipRestriction: settingsToSave,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save settings");
      }

      await queryClient.invalidateQueries({ queryKey: ["security-settings"] });
      toast.success("IP制限設定を保存しました");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("設定の保存に失敗しました");
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const ips = content.split("\\n").map((ip) => ip.trim()).filter(Boolean);
          setSettings({
            ...settings,
            allowedIPs: [...new Set([...settings.allowedIPs, ...ips])],
          });
        } catch (error) {
          console.error("Failed to import IP list:", error);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExport = () => {
    const content = settings.allowedIPs.join("\\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "allowed-ips.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>IPアドレス制限設定</CardTitle>
        <CardDescription>
          管理者ダッシュボードへのアクセスを許可するIPアドレスを設定します。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="enableIPRestriction">IP制限を有効にする</Label>
          <Switch
            id="enableIPRestriction"
            checked={settings.enableIPRestriction}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, enableIPRestriction: checked })
            }
          />
        </div>

        {settings.enableIPRestriction && (
          <>
            <div className="space-y-2">
              <Label htmlFor="newIP">許可するIPアドレス/CIDR</Label>
              <div className="flex space-x-2">
                <Input
                  id="newIP"
                  placeholder="例: 192.168.1.0/24"
                  value={settings.newIP}
                  onChange={(e) =>
                    setSettings({ ...settings, newIP: e.target.value })
                  }
                />
                <Button onClick={handleAddIP}>追加</Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>許可済みIPアドレス</Label>
              <div className="flex flex-wrap gap-2">
                {settings.allowedIPs.map((ip) => (
                  <Badge key={ip} variant="secondary">
                    {ip}
                    <button
                      onClick={() => handleRemoveIP(ip)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => document.getElementById("import-ip")?.click()}>
                インポート
              </Button>
              <input
                id="import-ip"
                type="file"
                accept=".txt"
                className="hidden"
                onChange={handleImport}
              />
              <Button variant="outline" onClick={handleExport}>
                エクスポート
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="blockUnknownIPs">
                  未許可IPからのアクセスをブロック
                </Label>
                <Switch
                  id="blockUnknownIPs"
                  checked={settings.blockUnknownIPs}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, blockUnknownIPs: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="notifyOnBlock">
                  ブロック時に管理者に通知
                </Label>
                <Switch
                  id="notifyOnBlock"
                  checked={settings.notifyOnBlock}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, notifyOnBlock: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="logBlockedAttempts">
                  ブロックされたアクセスを記録
                </Label>
                <Switch
                  id="logBlockedAttempts"
                  checked={settings.logBlockedAttempts}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, logBlockedAttempts: checked })
                  }
                />
              </div>
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