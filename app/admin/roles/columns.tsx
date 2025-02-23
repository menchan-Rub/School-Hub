"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Role } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Settings, MoreHorizontal } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ja } from "date-fns/locale"

export const columns: ColumnDef<Role>[] = [
  {
    accessorKey: "name",
    header: "Role",
    cell: ({ row }) => {
      const role = row.original
      return (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
            {role.name[0].toUpperCase()}
          </div>
          <div>
            <div className="font-medium">{role.name}</div>
            <div className="text-sm text-muted-foreground">
              {role.userCount || 0} users
            </div>
          </div>
        </div>
      )
    }
  },
  {
    accessorKey: "permissions",
    header: "Permissions",
    cell: ({ row }) => {
      const permissions = row.original.permissions
      return (
        <div className="flex flex-wrap gap-1">
          {Object.entries(permissions).map(([key, value]) => (
            <Badge key={key} variant={value.includes("manage") ? "info" : "default"}>
              {key}: {value.join(", ")}
            </Badge>
          ))}
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
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  }
] 