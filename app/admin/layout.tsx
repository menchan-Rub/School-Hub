import { Metadata } from "next"
import { Sidebar } from "@/components/admin/sidebar"
import { ThemeProvider } from "@/components/theme-provider"
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
    <ThemeProvider>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-muted/10">
          <div className="container mx-auto py-4">
            <AdminNav />
            {children}
          </div>
        </main>
      </div>
    </ThemeProvider>
  )
} 