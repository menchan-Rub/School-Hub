import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { NavigationSidebar } from "@/components/layout/navigation-sidebar"
import { SessionProvider } from "@/components/providers/session-provider"
import { QueryProvider } from "@/components/providers/query-provider"

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
    <html lang="ja" className="h-full" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full overflow-hidden font-inter">
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

