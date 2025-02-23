"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  ClockIcon, 
  ActivityIcon, 
  SettingsIcon
} from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { AnnouncementsSection } from "@/components/dashboard/announcements-section"

const DAILY_MESSAGES = [
  "今日も素晴らしい一日になりますように！",
  "新しい発見があるかもしれません",
  "今日はどんな発見があるでしょうか",
  "新しい知識を得る機会を探しましょう",
]

interface UserDashboardProps {
  onChatOpen: () => void;
  onFriendsOpen: () => void;
  onSettingsOpen: () => void;
  onAdminOpen: () => void;
  isAdmin: boolean;
}

export function UserDashboard({
  onChatOpen,
  onFriendsOpen,
  onSettingsOpen,
  onAdminOpen,
  isAdmin
}: UserDashboardProps) {
  const { data: session } = useSession()
  const [usageTime, setUsageTime] = useState(0)
  const [dailyMessage, setDailyMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true)
      try {
        const messageIndex = Math.floor(Math.random() * DAILY_MESSAGES.length)
        setDailyMessage(DAILY_MESSAGES[messageIndex])
        
        const response = await fetch('/api/user/stats')
        if (!response.ok) throw new Error('Failed to fetch stats')
        const data = await response.json()
        setUsageTime(data.usageTime)
      } catch (error) {
        console.error('Error loading dashboard:', error)
        setUsageTime(0)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadDashboard()
  }, [])

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="p-8 space-y-8 bg-[#0f0f10]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text">
            マイダッシュボード
          </h2>
          <p className="text-zinc-400">
            ようこそ、{session?.user?.name}さん
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <ActivityIcon className="h-4 w-4" />
          <span>ステータス:</span>
          <span className="text-green-500">オンライン</span>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-zinc-200">{dailyMessage}</CardTitle>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-1">
          <Card className="bg-gradient-to-br from-purple-500/5 via-indigo-500/5 to-pink-500/5">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-zinc-200">お知らせ</CardTitle>
            </CardHeader>
            <CardContent>
              <AnnouncementsSection />
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium text-zinc-200">本日の利用時間</CardTitle>
            <ClockIcon className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-center py-4 text-zinc-200">
              {Math.floor(usageTime / 60)}時間 {usageTime % 60}分
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2.5">
              <div 
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2.5 rounded-full"
                style={{ width: `${(usageTime / (24 * 60)) * 100}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:bg-zinc-900/50 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-200">チャット</CardTitle>
            <SettingsIcon className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-400 mb-4">友達とチャットを開始</p>
            <Button 
              variant="outline"
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0"
              onClick={onChatOpen}
            >
              開く
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:bg-zinc-900/50 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-200">設定</CardTitle>
            <SettingsIcon className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-400 mb-4">アカウント設定を変更</p>
            <Button 
              variant="outline"
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0"
              onClick={onSettingsOpen}
            >
              開く
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 