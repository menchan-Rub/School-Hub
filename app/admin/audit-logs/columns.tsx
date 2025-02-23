"use client"

import { ColumnDef } from "@tanstack/react-table"
import { AuditLog } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { ja } from "date-fns/locale"

export const columns: ColumnDef<AuditLog>[] = [
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => {
      const action = row.getValue("action") as string
      return (
        <Badge variant={
          action === "create" ? "success" :
          action === "update" ? "info" :
          action === "delete" ? "destructive" :
          "default"
        }>
          {action.toUpperCase()}
        </Badge>
      )
    }
  },
  {
    accessorKey: "performedBy",
    header: "User",
    cell: ({ row }) => {
      const performer = row.getValue("performedBy") as { name: string; role: string }
      return (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-muted" />
          <div>
            <div className="font-medium">{performer.name}</div>
            <div className="text-sm text-muted-foreground">{performer.role}</div>
          </div>
        </div>
      )
    }
  },
  {
    accessorKey: "details",
    header: "Details",
    cell: ({ row }) => {
      return (
        <div className="max-w-[500px] truncate text-muted-foreground">
          {row.getValue("details")}
        </div>
      )
    }
  },
  {
    accessorKey: "createdAt",
    header: "Time",
    cell: ({ row }) => {
      return formatDistanceToNow(new Date(row.getValue("createdAt")), {
        addSuffix: true,
        locale: ja
      })
    }
  }
] 