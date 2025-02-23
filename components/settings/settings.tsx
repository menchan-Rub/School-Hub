import { useSettings } from '@/hooks/use-settings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface SettingsProps {
  onBack: () => void
}

export function Settings({ onBack }: SettingsProps) {
  const { settings, isLoading, updateSettings } = useSettings()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!settings) {
    return null
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">設定</h1>
          <p className="text-muted-foreground">
            アカウントと環境設定を管理
          </p>
        </div>
        <Button onClick={onBack} variant="outline">
          戻る
        </Button>
      </div>

      <Tabs defaultValue="appearance">
        <TabsList className="mb-4">
          <TabsTrigger value="appearance">外観</TabsTrigger>
          <TabsTrigger value="notifications">通知</TabsTrigger>
          <TabsTrigger value="privacy">プライバシー</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>テーマ設定</CardTitle>
              <CardDescription>
                アプリケーションの表示テーマを設定します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>テーマ</Label>
                <Select
                  value={settings.theme}
                  onValueChange={(value) => 
                    updateSettings({ theme: value as 'light' | 'dark' | 'system' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">ライト</SelectItem>
                    <SelectItem value="dark">ダーク</SelectItem>
                    <SelectItem value="system">システム</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>通知設定</CardTitle>
              <CardDescription>
                通知の受信設定を管理します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>メッセージ通知</Label>
                <Switch
                  checked={settings.notifications.messages}
                  onCheckedChange={(checked) =>
                    updateSettings({
                      notifications: { ...settings.notifications, messages: checked }
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>フレンド申請通知</Label>
                <Switch
                  checked={settings.notifications.friendRequests}
                  onCheckedChange={(checked) =>
                    updateSettings({
                      notifications: { ...settings.notifications, friendRequests: checked }
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>アップデート通知</Label>
                <Switch
                  checked={settings.notifications.updates}
                  onCheckedChange={(checked) =>
                    updateSettings({
                      notifications: { ...settings.notifications, updates: checked }
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>プライバシー設定</CardTitle>
              <CardDescription>
                プライバシーとセキュリティの設定を管理します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>オンラインステータスを表示</Label>
                <Switch
                  checked={settings.privacy.showOnlineStatus}
                  onCheckedChange={(checked) =>
                    updateSettings({
                      privacy: { ...settings.privacy, showOnlineStatus: checked }
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>フレンド申請を許可</Label>
                <Switch
                  checked={settings.privacy.allowFriendRequests}
                  onCheckedChange={(checked) =>
                    updateSettings({
                      privacy: { ...settings.privacy, allowFriendRequests: checked }
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>最終アクセス時間を表示</Label>
                <Switch
                  checked={settings.privacy.showLastSeen}
                  onCheckedChange={(checked) =>
                    updateSettings({
                      privacy: { ...settings.privacy, showLastSeen: checked }
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 