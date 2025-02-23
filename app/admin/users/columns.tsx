"use client"

import { ColumnDef } from "@tanstack/react-table"
import { User } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { ja } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Shield } from "lucide-react"

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
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string
      return (
        <Badge variant={
          role === "super_admin" ? "premium" :
          role === "admin" ? "info" :
          "default"
        }>
          {role}
        </Badge>
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
          status === "active" ? "success" :
          status === "banned" ? "destructive" :
          "warning"
        }>
          {status}
        </Badge>
      )
    }
  },
  {
    accessorKey: "lastLogin",
    header: "Last Login",
    cell: ({ row }) => {
      const lastLogin = row.getValue("lastLogin") as string | null
      if (!lastLogin) return "Never"
      
      try {
        return formatDistanceToNow(new Date(lastLogin), {
          addSuffix: true,
          locale: ja
        })
      } catch (error) {
        return "Invalid date"
      }
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Shield className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  }
] 