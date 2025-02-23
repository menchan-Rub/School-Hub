"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Flag, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ja } from "date-fns/locale"

export type MessageLog = {
  id: string
  messageId: string
  channelId: string
  userId: string
  content: string
  type: string
  flagged: boolean
  createdAt: string
}

export const columns: ColumnDef<MessageLog>[] = [
  {
    accessorKey: "content",
    header: "メッセージ内容",
    cell: ({ row }) => (
      <div className="max-w-[500px] truncate">
        {row.original.content}
      </div>
    )
  },
  {
    accessorKey: "type",
    header: "種類",
    cell: ({ row }) => (
      <Badge>
        {row.original.type}
      </Badge>
    )
  },
  {
    accessorKey: "flagged",
    header: "フラグ",
    cell: ({ row }) => row.original.flagged && (
      <Badge variant="destructive">
        <Flag className="h-4 w-4 mr-1" />
        要確認
      </Badge>
    )
  },
  {
    accessorKey: "createdAt",
    header: "送信日時",
    cell: ({ row }) => formatDistanceToNow(
      new Date(row.original.createdAt),
      { addSuffix: true, locale: ja }
    )
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => {
            // メッセージ削除の処理
            fetch(`/api/admin/messages/${row.original.messageId}`, {
              method: 'DELETE'
            })
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    )
  }
]