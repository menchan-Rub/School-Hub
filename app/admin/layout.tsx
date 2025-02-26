import { Metadata } from "next"
import { Sidebar } from "@/components/admin/sidebar"
import { AdminNav } from "@/components/admin/nav"

export const metadata: Metadata = {
  title: "管理者パネル",
  description: "システム管理用のダッシュボード",
}

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1">
        <AdminNav />
        <div className="container mx-auto py-4">
          {children}
        </div>
      </div>
    </div>
  )
} 