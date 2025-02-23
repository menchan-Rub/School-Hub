"use client"

import { usePathname } from "next/navigation"
import { redirect } from "next/navigation"
import { useSession } from "next-auth/react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

const validPaths = [
  "/admin/users",
  "/admin/servers",
  "/admin/messages",
  "/admin/roles",
  "/admin/announcements",
  "/admin/audit-logs",
  "/admin/bans",
  "/admin/security",
  "/admin/charts/bar",
  "/admin/charts/line",
  "/admin/charts/pie",
  "/admin/settings",
  "/admin/help"
]

export default function CatchAllPage() {
  const pathname = usePathname()
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <LoadingSpinner />
  }

  if (!session) {
    redirect("/login")
  }

  if (!["admin", "super_admin"].includes(session.user.role)) {
    redirect("/dashboard")
  }
  
  if (!validPaths.includes(pathname)) {
    redirect("/admin")
  }
  
  return null
}