"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Card, CardHeader } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { History, AlertTriangle, Shield } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { AuditLog } from "@/lib/types"
import { columns } from "./columns"
import { StatsCard } from "@/components/admin/stats-card"
import { AdminPageHeader } from "@/components/admin/page-header"

export default function AuditLogsPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login")
    }
  })

  const { data: logs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ['auditLogs'],
    queryFn: async () => {
      const res = await fetch('/api/admin/audit-logs')
      if (!res.ok) throw new Error('Failed to fetch audit logs')
      return res.json()
    },
    enabled: !!session && ["super_admin", "admin"].includes(session.user.role)
  })

  if (!["super_admin", "admin"].includes(session?.user?.role ?? "")) redirect("/dashboard")
  if (isLoading) return <LoadingSpinner />

  const stats = {
    totalLogs: logs.length,
    criticalEvents: logs.filter(log => log.action === "delete").length,
    recentEvents: logs.filter(log => {
      const eventDate = new Date(log.createdAt)
      const now = new Date()
      return now.getTime() - eventDate.getTime() < 24 * 60 * 60 * 1000
    }).length
  }

  return (
    <div className="p-6 space-y-8">
      <AdminPageHeader
        title="Audit Logs"
        subtitle="Track and monitor system activities"
        badge="Security Hub"
      />

      <div className="grid gap-6 md:grid-cols-3">
        <StatsCard 
          icon={History} 
          label="Total Events" 
          value={stats.totalLogs.toLocaleString()} 
          description="All time records"
        />
        <StatsCard 
          icon={AlertTriangle} 
          label="Critical Events" 
          value={stats.criticalEvents}
          description="High priority events"
          trend={stats.criticalEvents > 0 ? { value: stats.criticalEvents, isPositive: false } : undefined}
        />
        <StatsCard 
          icon={Shield} 
          label="Recent Events" 
          value={stats.recentEvents}
          description="Last 24 hours"
        />
      </div>

      <Card>
        <CardHeader>
          <DataTable columns={columns} data={logs} filterColumn="details" />
        </CardHeader>
      </Card>
    </div>
  )
} 