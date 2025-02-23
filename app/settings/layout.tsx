import { NavigationSidebar } from "@/components/layout/navigation-sidebar"
import { SettingsSidebar } from "@/components/layout/settings-sidebar"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-full">
      <div className="hidden md:flex h-full w-[72px] z-30 flex-col fixed inset-y-0">
        <NavigationSidebar />
      </div>
      <div className="hidden md:flex h-full w-[240px] z-30 flex-col fixed inset-y-0 left-[72px]">
        <SettingsSidebar />
      </div>
      <main className="md:pl-[312px] h-full">
        {children}
      </main>
    </div>
  )
} 