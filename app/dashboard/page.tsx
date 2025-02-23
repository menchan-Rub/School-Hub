"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { UserDashboard } from "@/components/dashboard/user-dashboard"

export default function DashboardPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login")
    },
  })

  if (status === "loading") {
    return <LoadingSpinner />
  }

  // セッションがない場合はログインページへ
  if (!session?.user) {
    redirect("/login")
  }

  // 管理者の場合でも、UserDashboardを表示
  // ただし、/adminへのリンクを表示する
  return (
    <>
      {(session.user.role === "admin" || session.user.role === "super_admin") && (
        <div className="p-4">
          <a 
            href="/admin" 
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            管理者ダッシュボードへ →
          </a>
        </div>
      )}
      <UserDashboard />
    </>
  )
}