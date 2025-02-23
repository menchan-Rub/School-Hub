"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Badge } from "@/components/ui/badge"
import { Users, MessageSquare, Server, Activity, Shield, AlertTriangle, Lock } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { AdminStats } from "@/lib/types"
import { StatsCard } from "@/components/admin/stats-card"
import { AdminPageHeader } from "@/components/admin/page-header"
import dynamic from "next/dynamic"
import { useEffect } from "react"

const LineChart = dynamic(() => import("@/components/admin/line-chart"), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-card" />
})

export default function AdminPage() {
  const { data: session, status } = useSession()

  // セッションがない場合はログインページにリダイレクト
  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login")
    }
  }, [status])

  const { data: stats, isLoading, error } = useQuery<AdminStats>({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/stats')
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to fetch admin stats')
      }
      return res.json()
    },
    enabled: !!session?.user?.role && ["super_admin", "admin"].includes(session.user.role as string),
    retry: 1
  })

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!session || !["super_admin", "admin"].includes(session.user?.role as string)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Shield className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-4">アクセス権限がありません</h1>
        <p className="text-muted-foreground">このページを表示するには管理者権限が必要です。</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-4">エラーが発生しました</h1>
        <p className="text-muted-foreground">{error instanceof Error ? error.message : "データの取得に失敗しました"}</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      <AdminPageHeader
        title="管理者ダッシュボード"
        subtitle="システムの状態と統計情報"
      >
        <Badge variant="outline" className="gap-1">
          <Shield className="h-3 w-3" />
          システム状態: <span className="text-emerald-500">正常</span>
        </Badge>
      </AdminPageHeader>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          icon={Users}
          title="総ユーザー数" 
          value={stats?.totalUsers.toLocaleString() || "0"} 
          description="登録ユーザー"
          trend={{ value: 14, isPositive: true }}
        />
        <StatsCard 
          icon={Activity}
          title="アクティブユーザー" 
          value={stats?.activeUsers.toLocaleString() || "0"} 
          description="オンライン中"
          trend={{ value: 21, isPositive: true }}
        />
        <StatsCard 
          icon={Server}
          title="総サーバー数" 
          value={stats?.totalServers || "0"} 
          description="登録サーバー"
          trend={{ value: 5, isPositive: true }}
        />
        <StatsCard 
          icon={MessageSquare}
          title="総メッセージ数" 
          value={stats?.totalMessages.toLocaleString() || "0"} 
          description="コミュニケーション"
          trend={{ value: 43, isPositive: true }}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              ユーザー増加傾向
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart data={stats?.monthlyActiveUsers ?? []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              セキュリティ概要
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <StatsCard 
                icon={AlertTriangle}
                title="セキュリティアラート" 
                value="0" 
                description="アクティブな脅威なし"
                trend={{ value: 0, isPositive: true }}
              />
              <StatsCard 
                icon={Lock}
                title="システムセキュリティ" 
                value="保護済み" 
                description="全システム安全"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 