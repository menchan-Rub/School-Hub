"use client"

import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Info, AlertTriangle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"

interface Announcement {
  id: string
  title: string
  content: string
  type: "INFO" | "WARNING" | "ERROR"
  priority: number
  isRead: boolean
  createdAt: string
}

export function AnnouncementsSection() {
  const { data: announcements, isLoading, error } = useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: async () => {
      const res = await fetch('/api/announcements')
      if (!res.ok) throw new Error('Failed to fetch announcements')
      return res.json()
    }
  })

  const markAsRead = async (announcementId: string) => {
    try {
      const res = await fetch(`/api/announcements/${announcementId}/read`, {
        method: 'POST'
      })
      if (!res.ok) throw new Error('Failed to mark as read')
    } catch (error) {
      console.error('Failed to mark announcement as read:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-zinc-400">
        <AlertCircle className="h-10 w-10 mb-2" />
        <p>お知らせの読み込みに失敗しました</p>
      </div>
    )
  }

  if (!announcements?.length) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-zinc-400">
        <Info className="h-10 w-10 mb-2" />
        <p>新しいお知らせはありません</p>
      </div>
    )
  }

  const getIcon = (type: Announcement['type']) => {
    switch (type) {
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'ERROR':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  return (
    <ScrollArea className="h-[300px] pr-4">
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className={`
              relative p-4 rounded-lg border
              ${announcement.isRead ? 'bg-background/40' : 'bg-background/60'}
              ${announcement.type === 'ERROR' ? 'border-red-500/20' : 
                announcement.type === 'WARNING' ? 'border-yellow-500/20' : 
                'border-blue-500/20'}
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {getIcon(announcement.type)}
                <div>
                  <h4 className="font-semibold text-sm">{announcement.title}</h4>
                  <p className="text-sm text-zinc-400 mt-1">{announcement.content}</p>
                  <p className="text-xs text-zinc-500 mt-2">
                    {format(new Date(announcement.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                  </p>
                </div>
              </div>
              {!announcement.isRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAsRead(announcement.id)}
                  className="text-xs"
                >
                  既読にする
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
} 