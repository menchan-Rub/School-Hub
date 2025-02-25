"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { LoginForm } from "./components/auth/LoginForm"
import { UserDashboard } from "@/components/dashboard/user-dashboard"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { useNavigationStore } from "@/lib/stores/navigation-store"

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { activeView } = useNavigationStore()

  // セッションの状態を監視
  useEffect(() => {
    if (status === "loading") return

    // セッションが無効な場合はログインフォームを表示
    if (!session) {
      console.log("セッションが無効です")
      return
    }

    // セッションが有効な場合はダッシュボードを表示
    console.log("セッションが有効です", session)
  }, [session, status])

  // ローディング中
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">読み込み中...</p>
        </div>
      </div>
    )
  }

  // セッションが無効な場合はログインフォームを表示
  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoginForm />
      </div>
    )
  }

  // アクティブビューに基づいてコンポーネントを表示
  const renderView = () => {
    switch (activeView) {
      case 'admin':
        if (session.user?.role === "super_admin" || session.user?.role === "admin") {
          return <AdminDashboard stats={{
            totalUsers: 0,
            activeUsers: 0,
            totalServers: 0,
            totalMessages: 0,
            monthlyActiveUsers: []
          }} />
        }
        return <UserDashboard />
      case 'browser':
        return <div>ブラウザビュー</div>
      case 'chat':
        return <div>チャットビュー</div>
      case 'friends':
        return <div>フレンドビュー</div>
      case 'notifications':
        return <div>通知ビュー</div>
      case 'settings':
        return <div>設定ビュー</div>
      default:
        return <UserDashboard />
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {renderView()}
    </div>
  )
} 