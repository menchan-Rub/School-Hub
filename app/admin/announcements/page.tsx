"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Card, CardHeader } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Bell, FileText, Eye } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Announcement } from "@/lib/types"
import { columns } from "./columns"
import { StatsCard } from "@/components/admin/stats-card"
import { AdminPageHeader } from "@/components/admin/page-header"

export default function AnnouncementsPage() {
  const { data: session, status } = useSession()
  const { data: announcements = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: async () => {
      const res = await fetch('/api/admin/announcements')
      if (!res.ok) throw new Error('Failed to fetch announcements')
      return res.json()
    },
    enabled: !!session && ["super_admin", "admin"].includes(session.user.role)
  })

  if (!session || !["super_admin", "admin"].includes(session.user.role)) redirect("/login")
  if (status === "loading" || isLoading) return <LoadingSpinner />

  const stats = {
    totalAnnouncements: announcements.length,
    publishedCount: announcements.filter(a => a.status === "published").length,
    draftCount: announcements.filter(a => a.status === "draft").length
  }

  return (
    <div className="p-6 space-y-8">
      <AdminPageHeader
        title="Announcements"
        subtitle="Manage system-wide announcements"
        badge="Broadcast Hub"
      />

      <div className="grid gap-6 md:grid-cols-3">
        <StatsCard 
          icon={Bell} 
          label="Total" 
          value={stats.totalAnnouncements} 
          description="All announcements"
        />
        <StatsCard 
          icon={Eye} 
          label="Published" 
          value={stats.publishedCount}
          description="Live announcements"
        />
        <StatsCard 
          icon={FileText} 
          label="Drafts" 
          value={stats.draftCount}
          description="Work in progress"
        />
      </div>

      <Card>
        <CardHeader>
          <DataTable columns={columns} data={announcements} filterColumn="title" />
        </CardHeader>
      </Card>
    </div>
  )
}