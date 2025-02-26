"use client"

import { useSession } from "next-auth/react"
import { redirect, useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Shield, AlertTriangle } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { AdminStats } from "@/lib/types"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { useEffect } from "react"

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

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

  const handleHomeClick = () => {
    router.push('/dashboard')
  }

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
        <p className="text-muted-foreground">{error instanceof Error ? error.message : '統計データの取得に失敗しました'}</p>
      </div>
    )
  }

  return (
    <div className="flex-1">
      <AdminDashboard 
        stats={stats || {
          totalUsers: 0,
          activeUsers: 0,
          totalServers: 0,
          totalMessages: 0,
          monthlyActiveUsers: []
        }}
        onHomeClick={handleHomeClick}
      />
    </div>
  )
} 