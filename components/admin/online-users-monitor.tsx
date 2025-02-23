"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { User, Clock, Monitor } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ja } from "date-fns/locale"

interface UserSession {
  id: string
  startTime: string
  userAgent: string
  ipAddress: string
}

interface CurrentUser {
  id: string
  name: string
  email: string
  image?: string
  role: string
  activeSessions: UserSession[]
}

export function OnlineUsersMonitor() {
  const { data: currentUser } = useQuery<CurrentUser>({
    queryKey: ['user-sessions'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users/online')
      if (!res.ok) throw new Error('Failed to fetch user sessions')
      return res.json()
    },
    refetchInterval: 30000 // 30秒ごとに更新
  })

  if (!currentUser) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-4 w-4" />
          現在のログイン状況
          <Badge variant="secondary" className="ml-2">
            {currentUser.activeSessions.length}セッション
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={currentUser.image} />
              <AvatarFallback>
                {currentUser.name?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{currentUser.name}</div>
              <div className="text-sm text-muted-foreground">
                {currentUser.role === "super_admin" ? "スーパー管理者" : "管理者"}
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {currentUser.activeSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm">{session.userAgent}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(session.startTime), {
                        addSuffix: true,
                        locale: ja
                      })}からログイン中
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {session.ipAddress}
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}