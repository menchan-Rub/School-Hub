"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, AlertTriangle, Activity } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Message } from "@/lib/types"
import { columns } from "./columns"
import { StatsCard } from "@/components/admin/stats-card"
import { AdminPageHeader } from "@/components/admin/page-header"

export default function MessagesPage() {
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login")
    }
  })

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ['messages'],
    queryFn: async () => {
      const res = await fetch('/api/admin/messages')
      if (!res.ok) throw new Error('Failed to fetch messages')
      return res.json()
    },
    enabled: !!session && ["super_admin", "admin"].includes(session.user.role)
  })

  if (!["super_admin", "admin"].includes(session?.user?.role ?? "")) redirect("/dashboard")
  if (isLoading) return <LoadingSpinner />

  const stats = {
    totalMessages: messages.length,
    flaggedMessages: messages.filter(m => m.flagged).length,
    messageRate: Math.round(messages.length / 24)
  }

  return (
    <div className="p-6 space-y-8">
      <AdminPageHeader
        title="Message Monitor"
        subtitle="Real-time message monitoring and moderation"
        badge="Communication Hub"
      >
        <Badge variant={stats.flaggedMessages > 0 ? "destructive" : "success"}>
          <AlertTriangle className="h-3 w-3 mr-1" />
          {stats.flaggedMessages > 0 ? `${stats.flaggedMessages} Flagged` : "All Clear"}
        </Badge>
      </AdminPageHeader>

      <div className="grid gap-6 md:grid-cols-3">
        <StatsCard 
          icon={MessageSquare} 
          label="Total Messages" 
          value={stats.totalMessages.toLocaleString()} 
          description="All time messages"
        />
        <StatsCard 
          icon={Activity} 
          label="Message Rate" 
          value={`${stats.messageRate}/hr`}
          description="Average messages per hour"
        />
        <StatsCard 
          icon={AlertTriangle} 
          label="Flagged Messages" 
          value={stats.flaggedMessages}
          description="Requiring attention"
          trend={stats.flaggedMessages > 0 ? { value: stats.flaggedMessages, isPositive: false } : undefined}
        />
      </div>

      <Card>
        <CardHeader>
          <DataTable columns={columns} data={messages} filterColumn="content" />
        </CardHeader>
      </Card>
    </div>
  )
} 