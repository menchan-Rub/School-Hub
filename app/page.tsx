"use client"

import React, { useEffect } from "react"
import { useSession } from "next-auth/react"
import { LoginForm } from "./components/auth/LoginForm"
import { UserDashboard } from "@/components/dashboard/user-dashboard"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { UserManagementSection } from "@/components/dashboard/admin/user-management-section"
import { ServerMonitoringSection } from "@/components/dashboard/admin/server-monitoring-section"
import { SecuritySection } from "@/components/dashboard/admin/security-section"
import { SettingsSection } from "@/components/dashboard/admin/settings-section"
import { useNavigationStore } from "@/lib/stores/navigation-store"
import { AdminNav } from "@/components/admin/nav"
import { useQuery } from "@tanstack/react-query"
import { AdminStats } from "@/lib/types"
import BrowserPage from "@/app/browser/page"

export default function HomePage() {
  const { data: session, status } = useSession()
  const { activeView, setActiveView } = useNavigationStore()

  // 管理者統計データの取得
  const { data: adminStats } = useQuery<AdminStats>({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/stats')
      if (!res.ok) {
        throw new Error('Failed to fetch admin stats')
      }
      return res.json()
    },
    enabled: !!session?.user?.role && ["super_admin", "admin"].includes(session.user.role as string),
    retry: 1
  })

  // セッションの状態を監視
  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      console.log("未認証状態です")
      return
    }
    console.log("認証済み:", session.user)
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

  // メインコンテンツの表示
  const renderContent = () => {
    console.log('レンダリング中のビュー:', activeView)
    switch (activeView) {
      case 'admin-overview':
        return (
          <AdminDashboard 
            stats={adminStats || {
              totalUsers: 0,
              activeUsers: 0,
              totalServers: 0,
              totalMessages: 0,
              monthlyActiveUsers: []
            }}
            onHomeClick={() => setActiveView('dashboard')}
          />
        )
      case 'admin-users':
        return <UserManagementSection />
      case 'admin-servers':
        return <ServerMonitoringSection />
      case 'admin-messages':
        return <div>メッセージ管理</div>
      case 'admin-announcements':
        return <div>お知らせ管理</div>
      case 'admin-security':
        return <SecuritySection />
      case 'admin-audit-logs':
        return <div>監査ログ</div>
      case 'admin-bans':
        return <div>BAN管理</div>
      case 'admin-settings':
        return <SettingsSection />
      case 'friends':
        return <div>フレンド機能は開発中です</div>
      case 'chat':
        return <div>チャット機能は開発中です</div>
      case 'notifications':
        return <div>通知機能は開発中です</div>
      case 'browser':
        return (
          <div className="w-full h-full">
            <BrowserPage />
          </div>
        )
      case 'bookmarks':
        return <div>ブックマーク機能は開発中です</div>
      case 'dashboard':
      default:
        return <UserDashboard isAdmin={["super_admin", "admin"].includes(session.user?.role as string)} />
    }
  }

  // 管理者ページのレイアウト
  if (activeView.startsWith('admin-')) {
    return (
      <div className="flex">
        <AdminNav />
        <div className="flex-1">
          {renderContent()}
        </div>
      </div>
    )
  }

  // 一般ユーザーのダッシュボード
  return renderContent()
} 