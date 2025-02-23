"use client"

import { ColumnDef } from "@tanstack/react-table"
import { User } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Undo, MoreHorizontal } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ja } from "date-fns/locale"

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "User",
    cell: ({ row }) => {
      const user = row.original
      return (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-muted" />
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        </div>
      )
    }
  },
  {
    accessorKey: "banType",
    header: "Ban Type",
    cell: ({ row }) => {
      const banType = row.getValue("banType") as string
      return (
        <Badge variant={banType === "permanent" ? "destructive" : "warning"}>
          {banType.charAt(0).toUpperCase() + banType.slice(1)}
        </Badge>
      )
    }
  },
  {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => {
      return (
        <div className="max-w-[500px] truncate text-muted-foreground">
          {row.getValue("reason")}
        </div>
      )
    }
  },
  {
    accessorKey: "bannedAt",
    header: "Banned",
    cell: ({ row }) => {
      return formatDistanceToNow(new Date(row.getValue("bannedAt")), {
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
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  }
] 