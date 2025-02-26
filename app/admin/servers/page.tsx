"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Card, CardHeader } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Server, Activity, Users, MessageSquare } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Server as ServerType } from "@/lib/types"
import { columns } from "./columns"
import { StatsCard } from "@/components/admin/stats-card"
import { AdminPageHeader } from "@/components/admin/page-header"
import { Sidebar } from "@/components/admin/sidebar"
import { AdminNav } from "@/components/admin/nav"

export default function ServersPage() {
  const { data: session, status } = useSession()

  const { data: servers = [], isLoading } = useQuery<ServerType[]>({
    queryKey: ['servers'],
    queryFn: async () => {
      const res = await fetch('/api/admin/servers')
      if (!res.ok) throw new Error('Failed to fetch servers')
      return res.json()
    },
    enabled: !!session && ["super_admin", "admin"].includes(session.user?.role as string)
  })

  if (status === "loading" || isLoading) {
    return <LoadingSpinner />
  }

  if (!session) {
    redirect("/login")
  }

  if (!["super_admin", "admin"].includes(session.user?.role as string)) {
    redirect("/dashboard")
  }

  const stats = {
    totalServers: servers.length,
    activeServers: servers.filter(s => s.status === "online").length,
    totalMembers: servers.reduce((acc, server) => acc + server.memberCount, 0),
    totalMessages: servers.reduce((acc, server) => acc + (server.messageCount || 0), 0)
  }

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <AdminNav />
        <div className="p-8">
          <AdminPageHeader
            title="サーバー管理"
            subtitle="チャットサーバーの監視と管理"
            badge="Server Hub"
          />

          <div className="grid gap-6 md:grid-cols-4 mt-8">
            <StatsCard 
              icon={Server} 
              label="総サーバー数" 
              value={stats.totalServers} 
              description="登録済みサーバー"
            />
            <StatsCard 
              icon={Activity} 
              label="アクティブサーバー" 
              value={stats.activeServers}
              description="オンライン中"
              trend={{ value: (stats.activeServers / stats.totalServers) * 100, isPositive: true }}
            />
            <StatsCard 
              icon={Users} 
              label="総メンバー数" 
              value={stats.totalMembers.toLocaleString()}
              description="全サーバー合計"
            />
            <StatsCard 
              icon={MessageSquare} 
              label="総メッセージ数" 
              value={stats.totalMessages.toLocaleString()}
              description="全チャンネル合計"
            />
          </div>

          <Card className="mt-8">
            <CardHeader>
              <DataTable columns={columns} data={servers} filterColumn="name" />
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  )
} 