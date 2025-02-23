"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Card, CardHeader } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Button } from "@/components/ui/button"
import { PlusCircle, UserCircle, Activity, ShieldCheck } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { User } from "@/lib/types"
import { columns } from "./columns"
import { StatsCard } from "@/components/admin/stats-card"
import { AdminPageHeader } from "@/components/admin/page-header"
import { CreateUserModal } from "@/components/admin/create-user-modal"

export default function UsersPage() {
  const { data: session } = useSession()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users')
      if (!res.ok) throw new Error('Failed to fetch users')
      return res.json()
    },
    enabled: !!session && ["super_admin", "admin"].includes(session.user.role)
  })

  if (!session) {
    redirect("/login")
  }

  if (!["super_admin", "admin"].includes(session.user.role)) {
    redirect("/dashboard")
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === "active").length,
    adminCount: users.filter(u => ["super_admin", "admin"].includes(u.role)).length
  }

  return (
    <div className="p-6 space-y-8">
      <AdminPageHeader
        title="ユーザー管理"
        subtitle="ユーザーの追加・編集・削除"
        badge="管理者専用"
      >
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          ユーザーを追加
        </Button>
      </AdminPageHeader>

      <div className="grid gap-6 md:grid-cols-3">
        <StatsCard 
          icon={UserCircle} 
          label="総ユーザー数" 
          value={stats.totalUsers.toLocaleString()} 
          description="登録アカウント"
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard 
          icon={Activity} 
          label="アクティブユーザー" 
          value={stats.activeUsers}
          description="現在アクティブ"
          trend={{ value: stats.activeUsers / stats.totalUsers * 100, isPositive: true }}
        />
        <StatsCard 
          icon={ShieldCheck} 
          label="管理者数" 
          value={stats.adminCount}
          description="管理権限保持者"
        />
      </div>

      <Card>
        <CardHeader>
          <DataTable columns={columns} data={users} filterColumn="name" />
        </CardHeader>
      </Card>

      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  )
} 