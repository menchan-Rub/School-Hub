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
import { AdminNav } from "@/components/admin/nav"
import { Sidebar } from "@/components/admin/sidebar"

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
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1">
        <AdminNav />
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-8">管理者ダッシュボード</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 統計カード */}
            <div className="bg-card p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">総ユーザー数</h3>
              <p className="text-3xl font-bold">{stats?.totalUsers.toLocaleString() || "0"}</p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">アクティブユーザー</h3>
              <p className="text-3xl font-bold">{stats?.activeUsers.toLocaleString() || "0"}</p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">総セッション数</h3>
              <p className="text-3xl font-bold">{stats?.totalSessions.toLocaleString() || "0"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 