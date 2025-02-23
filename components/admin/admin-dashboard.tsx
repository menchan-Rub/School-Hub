"use client"

import { Box } from "@mui/material"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, MessageSquare, Server, Activity, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import dynamic from "next/dynamic"
import { StatsCard } from "@/components/admin/stats-card"
import { OnlineUsersMonitor } from "@/components/admin/online-users-monitor"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const LineChart = dynamic(() => import("@/components/admin/line-chart"), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-card" />
})

interface AdminDashboardProps {
  stats: {
    totalUsers: number
    activeUsers: number
    totalServers: number
    totalMessages: number
    monthlyActiveUsers: Array<{
      date: string
      count: number
    }>
  }
}

export function AdminDashboard({ stats }: AdminDashboardProps) {
  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text">
              管理者ダッシュボード
            </h2>
            <Badge variant="outline" className="uppercase text-xs">
              Admin
            </Badge>
          </div>
          <p className="text-muted-foreground">
            システムの状態を一目で確認できます
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>システム状態:</span>
          <span className="text-green-500">正常稼働中</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          icon={Users} 
          label="総ユーザー数" 
          value={stats.totalUsers.toLocaleString()} 
          description="全サーバー合計"
          trend={{ value: 14, isPositive: true }}
        />
        <StatsCard 
          icon={Activity} 
          label="アクティブユーザー" 
          value={stats.activeUsers.toLocaleString()} 
          description="現在オンライン"
          trend={{ value: 21, isPositive: true }}
        />
        <StatsCard 
          icon={Server} 
          label="総サーバー数" 
          value={stats.totalServers} 
          description="登録済みサーバー"
          trend={{ value: 5, isPositive: true }}
        />
        <StatsCard 
          icon={MessageSquare} 
          label="総メッセージ数" 
          value={stats.totalMessages.toLocaleString()} 
          description="送信済みメッセージ"
          trend={{ value: 43, isPositive: true }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">利用状況分析</h3>
                <p className="text-sm text-muted-foreground">
                  ユーザーとメッセージの推移を確認できます
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>更新: たった今</span>
              </div>
            </div>
            <div className="h-[300px]">
              <LineChart data={stats.monthlyActiveUsers} />
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <OnlineUsersMonitor />
        </div>
      </div>
    </div>
  )
}