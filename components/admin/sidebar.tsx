"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Server,
  MessageSquare,
  Bell,
  Ban,
  History,
  Shield,
  Settings
} from "lucide-react"

const items = [
  {
    title: "Overview",
    href: "/admin",
    icon: LayoutDashboard
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users
  },
  {
    title: "Servers",
    href: "/admin/servers",
    icon: Server
  },
  {
    title: "Messages",
    href: "/admin/messages",
    icon: MessageSquare
  },
  {
    title: "Announcements",
    href: "/admin/announcements",
    icon: Bell
  },
  {
    title: "Security",
    href: "/admin/security",
    icon: Shield
  },
  {
    title: "Audit Logs",
    href: "/admin/audit-logs",
    icon: History
  },
  {
    title: "Bans",
    href: "/admin/bans",
    icon: Ban
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings
  }
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 border-r bg-card">
      <div className="p-6">
        <h2 className="text-lg font-semibold">Admin Panel</h2>
        <p className="text-sm text-muted-foreground">System management</p>
      </div>
      <nav className="space-y-1 px-2">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent",
                pathname === item.href ? "bg-accent" : "transparent"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          )
        })}
      </nav>
    </div>
  )
} 