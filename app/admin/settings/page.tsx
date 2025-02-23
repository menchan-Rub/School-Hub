"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { toast } from "sonner"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Settings, Database, Globe } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SystemSettings {
  maintenance: boolean
  language: string
  autoBackup: boolean
  queryLogging: boolean
  defaultLocale: string
  timezone: string
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<SystemSettings>({
    maintenance: false,
    language: "ja",
    autoBackup: true,
    queryLogging: false,
    defaultLocale: "ja",
    timezone: "Asia/Tokyo"
  })

  if (!session || !["super_admin", "admin"].includes(session.user?.role)) redirect("/login")
  if (status !== "authenticated") return <LoadingSpinner />

  const updateSetting = async (key: keyof SystemSettings, value: any) => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value })
      })

      if (!response.ok) throw new Error()

      setSettings(prev => ({ ...prev, [key]: value }))
      toast.success("設定を更新しました")
    } catch (error) {
      toast.error("設定の更新に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-8">
      <AdminPageHeader
        title="System Settings"
        subtitle="Configure global system settings"
        badge="Control Panel"
      />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="database">
            <Database className="h-4 w-4 mr-2" />
            Database
          </TabsTrigger>
          <TabsTrigger value="localization">
            <Globe className="h-4 w-4 mr-2" />
            Localization
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable maintenance mode for the entire system
                  </p>
                </div>
                <Switch
                  checked={settings.maintenance}
                  disabled={isLoading}
                  onCheckedChange={(checked) => updateSetting("maintenance", checked)}
                />
              </div>
              <div className="space-y-2">
                <Label>System Language</Label>
                <Select
                  value={settings.language}
                  disabled={isLoading}
                  onValueChange={(value) => updateSetting("language", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>データベース設定</CardTitle>
            </CardHeader>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>自動バックアップ</Label>
                  <p className="text-sm text-muted-foreground">
                    定期的なデータベースバックアップを有効にする
                  </p>
                </div>
                <Switch
                  checked={settings.autoBackup}
                  disabled={isLoading}
                  onCheckedChange={(checked) => updateSetting("autoBackup", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>クエリログ</Label>
                  <p className="text-sm text-muted-foreground">
                    データベースクエリのログを記録する
                  </p>
                </div>
                <Switch
                  checked={settings.queryLogging}
                  disabled={isLoading}
                  onCheckedChange={(checked) => updateSetting("queryLogging", checked)}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="localization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ローカライゼーション設定</CardTitle>
            </CardHeader>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>デフォルト言語</Label>
                <Select
                  value={settings.defaultLocale}
                  disabled={isLoading}
                  onValueChange={(value) => updateSetting("defaultLocale", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="言語を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ja">日本語</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>タイムゾーン</Label>
                <Select
                  value={settings.timezone}
                  disabled={isLoading}
                  onValueChange={(value) => updateSetting("timezone", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="タイムゾーンを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Tokyo">Asia/Tokyo (UTC+9)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}