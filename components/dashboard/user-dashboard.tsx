"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Users, Globe, Settings, Shield, Clock } from "lucide-react"
import { useNavigationStore } from "@/lib/stores/navigation-store"
import { useRouter } from "next/navigation"

interface UserDashboardProps {
  isAdmin?: boolean;
}

export function UserDashboard({
  isAdmin = false
}: UserDashboardProps) {
  const router = useRouter()
  const [usageTime, setUsageTime] = useState(0)
  const { setActiveView } = useNavigationStore()

  useEffect(() => {
    console.log('UserDashboard mounted', { isAdmin })
  }, [isAdmin])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/user/stats')
        if (!response.ok) {
          throw new Error('Failed to fetch stats')
        }
        const data = await response.json()
        setUsageTime(data.usageTime.hours * 60 + data.usageTime.minutes)
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleChatOpen = useCallback(() => setActiveView('chat'), [setActiveView])
  const handleFriendsOpen = useCallback(() => setActiveView('friends'), [setActiveView])
  const handleBrowserOpen = useCallback(() => {
    router.push('/browser')
  }, [router])
  const handleSettingsOpen = useCallback(() => setActiveView('settings'), [setActiveView])
  const handleAdminOpen = useCallback(() => {
    if (isAdmin) {
      console.log('管理者ダッシュボードを開きます')
      setActiveView('admin-overview')
    }
  }, [isAdmin, setActiveView])

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text">
            マイダッシュボード
          </h2>
          <p className="text-muted-foreground">
            今日も素晴らしい一日になりますように！
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <span className="text-muted-foreground">
            本日の利用時間: {Math.floor(usageTime / 60)}時間 {usageTime % 60}分
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <Card className="p-4 bg-card hover:bg-card/80">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-5 h-5" />
            <h2 className="font-semibold">チャットを始める</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">友達とメッセージを交換</p>
          <Button 
            variant="secondary" 
            className="w-full"
            onClick={handleChatOpen}
          >
            開く
          </Button>
        </Card>

        <Card className="p-4 bg-card hover:bg-card/80">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5" />
            <h2 className="font-semibold">フレンド</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">フレンドリストを確認</p>
          <Button 
            variant="secondary" 
            className="w-full"
            onClick={handleFriendsOpen}
          >
            開く
          </Button>
        </Card>

        <Card className="p-4 bg-card hover:bg-card/80">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-5 h-5" />
            <h2 className="font-semibold">ブラウザを開く</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">安全なブラウジングを開始</p>
          <Button 
            variant="secondary" 
            className="w-full"
            onClick={handleBrowserOpen}
          >
            開く
          </Button>
        </Card>

        <Card className="p-4 bg-card hover:bg-card/80">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-5 h-5" />
            <h2 className="font-semibold">設定</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">アカウント設定を変更</p>
          <Button 
            variant="secondary" 
            className="w-full"
            onClick={handleSettingsOpen}
          >
            開く
          </Button>
        </Card>

        {isAdmin && (
          <Card className="p-4 bg-card hover:bg-card/80">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5" />
              <h2 className="font-semibold">管理者ダッシュボード</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">システム管理と監視</p>
            <Button 
              variant="primary" 
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
              onClick={handleAdminOpen}
            >
              開く
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
} 