"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Announcement } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit2, Eye, MoreHorizontal } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ja } from "date-fns/locale"

export const columns: ColumnDef<Announcement>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => {
      const announcement = row.original
      return (
        <div className="space-y-1">
          <div className="font-medium">{announcement.title}</div>
          <div className="text-sm text-muted-foreground line-clamp-1">
            {announcement.content}
          </div>
        </div>
      )
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge variant={
          status === "published" ? "success" :
          status === "draft" ? "secondary" :
          "default"
        }>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      )
    }
  },
  {
    accessorKey: "author",
    header: "Author",
    cell: ({ row }) => {
      const author = row.original.author
      return (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-muted" />
          <div>
            <div className="font-medium">{author.name}</div>
            <div className="text-sm text-muted-foreground">{author.role}</div>
          </div>
        </div>
      )
    }
  },
  {
    accessorKey: "updatedAt",
    header: "Last Updated",
    cell: ({ row }) => {
      return formatDistanceToNow(new Date(row.getValue("updatedAt")), {
        addSuffix: true,
        locale: ja
      })
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  }
] 