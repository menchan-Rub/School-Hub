"use client"

import { ThemeProvider } from 'next-themes'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import "./styles/globals.css"
import "./styles/chrome-tabs.css"
import "./styles/chrome-tabs-dark-theme.css"

interface ClientLayoutProps {
  children: ReactNode
}

// QueryClientをクライアントサイドでのみ作成するために
// コンポーネントの外で定義
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-background">
            {children}
          </div>
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  )
} 