import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { NavigationSidebar } from "@/components/layout/navigation-sidebar"
import { SessionProvider } from "@/components/providers/session-provider"
import { QueryProvider } from "@/components/providers/query-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "School-Hub",
  description: "学校向けの統合プラットフォーム",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" suppressHydrationWarning className="h-full">
      <body className={`${inter.className} h-full overflow-hidden`}>
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            storageKey="school-hub-theme"
          >
            <SessionProvider>
              <div className="flex h-screen overflow-hidden">
                <div className="fixed left-0 top-0 h-full w-[72px] z-50">
                  <NavigationSidebar />
                </div>
                <main className="flex-1 pl-[72px] h-full overflow-y-auto">
                  {children}
                </main>
              </div>
            </SessionProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}

