"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Settings, Globe, Database, Clock } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

interface SystemSettings {
  maintenance: boolean
  language: string
  autoBackup: boolean
  queryLogging: boolean
  defaultLocale: string
  timezone: string
}

export function SettingsSection() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // 設定を取得
  const { data: settings, isLoading } = useQuery<SystemSettings>({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/settings')
      if (!res.ok) throw new Error('Failed to fetch settings')
      return res.json()
    }
  })

  // 設定を更新
  const { mutate: updateSetting } = useMutation({
    mutationFn: async ({ key, value }: { key: keyof SystemSettings, value: any }) => {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      })
      if (!res.ok) throw new Error('Failed to update setting')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] })
      toast({
        title: "設定を更新しました",
        description: "システム設定が正常に更新されました。",
      })
    },
    onError: (error) => {
      toast({
        title: "エラーが発生しました",
        description: error instanceof Error ? error.message : "設定の更新に失敗しました。",
        variant: "destructive"
      })
    }
  })

  if (isLoading || !settings) {
    return <div>読み込み中...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>システム設定</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              <span className="font-medium">メンテナンスモード</span>
            </div>
            <p className="text-sm text-muted-foreground">
              システムのメンテナンス状態を切り替えます
            </p>
          </div>
          <Switch
            checked={settings.maintenance}
            onCheckedChange={(checked) => updateSetting({ key: 'maintenance', value: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center">
              <Database className="w-4 h-4 mr-2" />
              <span className="font-medium">自動バックアップ</span>
            </div>
            <p className="text-sm text-muted-foreground">
              データベースの自動バックアップを有効にします
            </p>
          </div>
          <Switch
            checked={settings.autoBackup}
            onCheckedChange={(checked) => updateSetting({ key: 'autoBackup', value: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center">
              <Globe className="w-4 h-4 mr-2" />
              <span className="font-medium">クエリログ</span>
            </div>
            <p className="text-sm text-muted-foreground">
              データベースクエリのログを記録します
            </p>
          </div>
          <Switch
            checked={settings.queryLogging}
            onCheckedChange={(checked) => updateSetting({ key: 'queryLogging', value: checked })}
          />
        </div>
      </CardContent>
    </Card>
  )
}