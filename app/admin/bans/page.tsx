"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Card, CardHeader } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Ban, Clock, Users } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { User } from "@/lib/types"
import { columns } from "./columns"
import { StatsCard } from "@/components/admin/stats-card"
import { AdminPageHeader } from "@/components/admin/page-header"

export default function BansPage() {
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login")
    }
  })

  const { data: bannedUsers = [], isLoading } = useQuery<User[]>({
    queryKey: ['bannedUsers'],
    queryFn: async () => {
      const res = await fetch('/api/admin/bans')
      if (!res.ok) throw new Error('Failed to fetch banned users')
      return res.json()
    },
    enabled: !!session && ["super_admin", "admin"].includes(session.user.role)
  })

  if (!["super_admin", "admin"].includes(session?.user?.role ?? "")) redirect("/dashboard")
  if (isLoading) return <LoadingSpinner />

  const stats = {
    totalBans: bannedUsers.length,
    recentBans: bannedUsers.filter(user => {
      const banDate = new Date(user.lastLogin)
      const now = new Date()
      return now.getTime() - banDate.getTime() < 24 * 60 * 60 * 1000
    }).length,
    permanentBans: bannedUsers.filter(user => user.banType === "permanent").length
  }

  return (
    <div className="p-6 space-y-8">
      <AdminPageHeader
        title="Ban Management"
        subtitle="Monitor and manage banned users"
        badge="Enforcement"
      />

      <div className="grid gap-6 md:grid-cols-3">
        <StatsCard 
          icon={Ban} 
          label="Total Bans" 
          value={stats.totalBans} 
          description="All time"
        />
        <StatsCard 
          icon={Clock} 
          label="Recent Bans" 
          value={stats.recentBans}
          description="Last 24 hours"
        />
        <StatsCard 
          icon={Users} 
          label="Permanent Bans" 
          value={stats.permanentBans}
          description="No appeal"
        />
      </div>

      <Card>
        <CardHeader>
          <DataTable columns={columns} data={bannedUsers} filterColumn="name" />
        </CardHeader>
      </Card>
    </div>
  )
} 