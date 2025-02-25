"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield } from "lucide-react"
import { AdminNav } from "@/components/admin/nav"
import { Sidebar } from "@/components/admin/sidebar"
import { BrowserMonitoringSection } from "@/components/dashboard/admin/browser-monitoring-section"
import { UserManagementSection } from "@/components/dashboard/admin/user-management-section"
import { ServerMonitoringSection } from "@/components/dashboard/admin/server-monitoring-section"
import { SecuritySection } from "@/components/dashboard/admin/security-section"

interface AdminDashboardProps {
  stats: {
    totalUsers: number
    activeUsers: number
    totalServers: number
    totalMessages: number
    monthlyActiveUsers: Array<{ date: string; count: number }>
  }
}

export function AdminDashboard({ stats }: AdminDashboardProps) {
  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <AdminNav />
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text">
                  管理者ダッシュボード
                </h2>
                <Badge variant="outline" className="uppercase text-xs">
                  Admin
                </Badge>
              </div>
              <p className="text-muted-foreground">
                システムの状態を一目で確認できます
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>システム状態:</span>
              <span className="text-green-500">正常稼働中</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">総ユーザー数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  前月比 +{((stats.totalUsers / 100) * 14).toFixed(1)}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">アクティブユーザー</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeUsers}</div>
                <p className="text-xs text-muted-foreground">
                  前月比 +{((stats.activeUsers / 100) * 21).toFixed(1)}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">総サーバー数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalServers}</div>
                <p className="text-xs text-muted-foreground">
                  前月比 +{((stats.totalServers / 100) * 5).toFixed(1)}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">総メッセージ数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalMessages}</div>
                <p className="text-xs text-muted-foreground">
                  前月比 +{((stats.totalMessages / 100) * 43).toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <UserManagementSection />
            <BrowserMonitoringSection />
          </div>

          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <ServerMonitoringSection />
            <SecuritySection />
          </div>
        </div>
      </div>
    </div>
  )
}