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
  Shield,
  History,
  Ban,
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

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6 mb-8">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center text-sm font-medium transition-colors hover:text-primary",
              pathname === item.href
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <Icon className="h-4 w-4 mr-2" />
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
} 