"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { LoginForm } from "@/components/auth/LoginForm"
import { UserDashboard } from "@/components/dashboard/user-dashboard"

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

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

  // セッションが有効な場合はダッシュボードを表示
  return (
    <div className="container mx-auto px-4 py-8">
      <UserDashboard
        onBrowserOpen={() => console.log("ブラウザを開く")}
        onSettingsOpen={() => console.log("設定を開く")}
        onChatOpen={() => console.log("チャットを開く")}
        onFriendsOpen={() => console.log("フレンドリストを開く")}
        onAdminOpen={() => console.log("管理画面を開く")}
        isAdmin={session.user?.role === "admin"}
      />
    </div>
  )
} 