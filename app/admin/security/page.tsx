"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, Lock, Key, Activity, AlertTriangle, Network } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { SecuritySettings } from "@/lib/types"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { StatsCard } from "@/components/admin/stats-card"
import { AdminPageHeader } from "@/components/admin/page-header"
import { Sidebar } from "@/components/admin/sidebar"
import { AdminNav } from "@/components/admin/nav"

export default function SecurityPage() {
  const { data: session, status } = useSession()
  const securityScore = 85 // 仮の値

  const { data: settings, isLoading } = useQuery<SecuritySettings>({
    queryKey: ['security-settings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/security/settings')
      if (!res.ok) throw new Error('Failed to fetch security settings')
      return res.json()
    },
    enabled: !!session && ["super_admin", "admin"].includes(session.user?.role as string)
  })

  if (status === "loading" || isLoading) {
    return <LoadingSpinner />
  }

  if (!session) {
    redirect("/login")
  }

  if (!["super_admin", "admin"].includes(session.user?.role as string)) {
    redirect("/dashboard")
  }

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <AdminNav />
        <div className="p-8">
          <AdminPageHeader
            title="セキュリティ設定"
            subtitle="システム全体のセキュリティ設定を構成"
            badge="Security Control"
          />

          <div className="flex items-center justify-between mt-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text">
                  セキュリティセンター
                </h2>
                <Badge className="uppercase">
                  Defense Matrix
                </Badge>
              </div>
              <p className="text-muted-foreground">
                システムのセキュリティ設定を構成・監視
              </p>
            </div>
            <Badge 
              variant={securityScore >= 70 ? "default" : securityScore >= 40 ? "secondary" : "destructive"} 
              className="gap-1"
            >
              <ShieldCheck className="h-3 w-3" />
              セキュリティスコア: {securityScore}%
            </Badge>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mt-8">
            <StatsCard 
              icon={Lock} 
              label="2FA状態" 
              value={settings?.twoFactorEnabled ? "有効" : "無効"}
              description="二要素認証"
              trend={settings?.twoFactorEnabled ? { value: 40, isPositive: true } : undefined}
            />
            <StatsCard 
              icon={Activity} 
              label="セッションタイムアウト" 
              value={settings?.sessionTimeout || "未設定"}
              description="自動ログアウト期間"
            />
            <StatsCard 
              icon={AlertTriangle} 
              label="セキュリティアラート" 
              value="0"
              description="アクティブな脅威なし"
              trend={{ value: 0, isPositive: true }}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2 mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  認証設定
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>二要素認証</Label>
                    <p className="text-sm text-muted-foreground">
                      すべての管理者アカウントに2FAを要求
                    </p>
                  </div>
                  <Switch checked={settings?.twoFactorEnabled} />
                </div>
                <div className="space-y-2">
                  <Label>パスワード有効期限</Label>
                  <Select defaultValue={settings?.passwordExpiry}>
                    <SelectTrigger>
                      <SelectValue placeholder="有効期限を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30日</SelectItem>
                      <SelectItem value="60">60日</SelectItem>
                      <SelectItem value="90">90日</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5 text-primary" />
                  アクセス制御
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>IP制限</Label>
                    <p className="text-sm text-muted-foreground">
                      特定のIP範囲からのアクセスを制限
                    </p>
                  </div>
                  <Switch checked={settings?.ipRestrictionEnabled} />
                </div>
                <div className="space-y-2">
                  <Label>セッションタイムアウト</Label>
                  <Select defaultValue={settings?.sessionTimeout}>
                    <SelectTrigger>
                      <SelectValue placeholder="タイムアウト時間を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15分</SelectItem>
                      <SelectItem value="30">30分</SelectItem>
                      <SelectItem value="60">1時間</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end mt-8">
            <Button 
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
            >
              設定を保存
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}