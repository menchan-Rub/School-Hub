"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  MoreHorizontal,
  Shield,
  Rocket,
  Users,
  MessageSquare,
  Settings2,
  Power
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Server } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { ja } from "date-fns/locale"

export const columns: ColumnDef<Server>[] = [
  {
    accessorKey: "name",
    header: "Server",
    cell: ({ row }) => {
      const server = row.original
      return (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
            {server.name[0].toUpperCase()}
          </div>
          <div>
            <div className="font-medium">{server.name}</div>
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
          status === "online" ? "success" :
          status === "maintenance" ? "warning" :
          "destructive"
        }>
          {status === "online" ? "Online" :
           status === "maintenance" ? "Maintenance" :
           "Offline"}
        </Badge>
      )
    }
  },
  {
    accessorKey: "memberCount",
    header: "Members",
    cell: ({ row }) => {
      const count = row.getValue("memberCount") as number
      return count.toLocaleString()
    }
  },
  {
    accessorKey: "lastActive",
    header: "Last Active",
    cell: ({ row }) => {
      return formatDistanceToNow(new Date(row.getValue("lastActive")), {
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
            <Settings2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Power className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  }
]