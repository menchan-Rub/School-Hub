"use client"

import { DataTable } from "@/components/ui/data-table"
import { columns } from "@/app/admin/users/columns"
import { useUsers } from "@/hooks/use-users"

export function AdminRoles() {
  const { data: users, isLoading } = useUsers()

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={users || []} />
    </div>
  )
} 