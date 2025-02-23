"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Trash } from "lucide-react"
import { Message } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { ja } from "date-fns/locale"

export const columns: ColumnDef<Message>[] = [
  {
    accessorKey: "content",
    header: "Content",
    cell: ({ row }) => {
      const content = row.getValue("content") as string
      return <div className="max-w-[500px] truncate">{content}</div>
    }
  },
  {
    accessorKey: "author",
    header: "Author",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-muted" />
          <div>
            <div className="font-medium">{row.original.author.name}</div>
            <div className="text-sm text-muted-foreground">{row.original.author.email}</div>
          </div>
        </div>
      )
    }
  },
  {
    accessorKey: "createdAt",
    header: "Sent",
    cell: ({ row }) => {
      return formatDistanceToNow(new Date(row.getValue("createdAt")), {
        addSuffix: true,
        locale: ja
      })
    }
  },
  {
    accessorKey: "flagged",
    header: "Status",
    cell: ({ row }) => {
      const flagged = row.getValue("flagged") as boolean
      return flagged ? (
        <Badge variant="destructive">Flagged</Badge>
      ) : (
        <Badge variant="success">Clean</Badge>
      )
    }
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Button variant="ghost" size="sm" className="text-destructive">
        <Trash className="h-4 w-4" />
      </Button>
    )
  }
] 