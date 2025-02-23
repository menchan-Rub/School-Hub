"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Flag, AlertTriangle } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "@/app/admin/messages/columns"

export function MessageMonitor() {
  const { data: messages = [] } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: async () => {
      const res = await fetch('/api/admin/messages')
      if (!res.ok) throw new Error('Failed to fetch messages')
      return res.json()
    }
  })

  const { data: stats } = useQuery({
    queryKey: ['message-stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/messages/stats')
      if (!res.ok) throw new Error('Failed to fetch stats')
      return res.json()
    }
  })

  const flaggedMessages = messages.filter((m: any) => m.flagged)

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              総メッセージ数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-4 w-4" />
              フラグ付きメッセージ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {flaggedMessages.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <DataTable 
            columns={columns} 
            data={messages} 
            filterColumn="content"
          />
        </CardHeader>
      </Card>
    </div>
  )
} 