"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { AdminRoles } from "@/components/AdminRoles"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function RolesPage() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <LoadingSpinner />
  }

  if (!session || !["super_admin", "admin"].includes(session.user.role)) {
    redirect("/login")
  }

  return <AdminRoles />
} 