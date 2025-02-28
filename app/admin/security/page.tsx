"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, Lock, Key, Activity, AlertTriangle, Network } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import type { SecuritySettings } from "@/app/lib/types"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AccountLockoutSettings } from "@/app/admin/security/components/account-lockout-settings"
import { PasswordPolicySettings } from "@/app/admin/security/components/password-policy-settings"
import { MFASettings } from "@/app/admin/security/components/mfa-settings"
import { SessionSettings } from "@/app/admin/security/components/session-settings"
import { IPRestrictionSettings } from "@/app/admin/security/components/ip-restriction-settings"
import { WAFSettings } from "@/app/admin/security/components/waf-settings"
import { BackupSettings } from "@/app/admin/security/components/backup-settings"
import { VulnerabilitySettings } from "@/app/admin/security/components/vulnerability-settings"

export default function SecuritySettingsPage() {
  const { data: session, status } = useSession()
  const securityScore = 85 // 仮の値

  const { data: settings, isLoading } = useQuery<SecuritySettings>({
    queryKey: ['security-settings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/security')
      if (!res.ok) throw new Error('Failed to fetch security settings')
      const data = await res.json()
      return {
        ...data,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      }
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

  const defaultSettings: SecuritySettings = {
    accountLockout: {
      maxLoginAttempts: 5,
      lockoutDuration: 30,
      lockoutDurationType: "minutes",
      autoUnlock: true,
      notifyAdmin: true,
    },
    passwordPolicy: {
      minLength: 8,
      maxLength: 32,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: true,
      expiryDays: 90,
      historyCount: 5,
      showStrengthMeter: true,
    },
    mfaSettings: {
      requireMFA: false,
      allowedMethods: ["authenticator", "sms", "email"],
      backupCodesCount: 10,
      mfaGracePeriod: 7,
      rememberDevice: true,
      rememberDeviceDuration: 30,
    },
    sessionSettings: {
      sessionTimeout: 30,
      timeoutUnit: "minutes",
      idleTimeout: 15,
      idleTimeoutUnit: "minutes",
      maxConcurrentSessions: 3,
      forceLogoutOnPasswordChange: true,
      forceLogoutOnRoleChange: true,
      enableSessionMonitoring: true,
    },
    ipRestriction: {
      enableIPRestriction: false,
      allowedIPs: ["192.168.1.0/24", "10.0.0.0/8"],
      blockUnknownIPs: true,
      notifyOnBlock: true,
      logBlockedAttempts: true,
    },
    wafSettings: {
      enableWAF: false,
      mode: "detection",
      rules: [
        {
          id: "sql-injection",
          name: "SQLインジェクション対策",
          enabled: true,
          priority: 1,
        },
      ],
      customRules: [],
      logLevel: "info",
      alertThreshold: 10,
    },
    backupSettings: {
      enableAutoBackup: true,
      backupSchedule: "daily",
      backupTime: "00:00",
      retentionPeriod: 30,
      backupTypes: {
        database: true,
        files: true,
        configurations: true,
      },
      compressionEnabled: true,
      encryptionEnabled: true,
      storageLocation: "local",
      notifyOnSuccess: true,
      notifyOnFailure: true,
    },
    vulnerabilitySettings: {
      enableScheduledScan: true,
      scanSchedule: "weekly",
      scanTime: "00:00",
      scanTargets: {
        webapp: true,
        api: true,
        database: true,
        server: true,
      },
      notifyOnCompletion: true,
      notifyOnVulnerability: true,
      severityThreshold: "medium",
      autoRemediation: false,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mergedSettings = settings || defaultSettings

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
              value={mergedSettings.mfaSettings.requireMFA ? "有効" : "無効"}
              description="二要素認証"
              trend={mergedSettings.mfaSettings.requireMFA ? { value: 40, isPositive: true } : undefined}
            />
            <StatsCard 
              icon={Activity} 
              label="セッションタイムアウト" 
              value={`${mergedSettings.sessionSettings.sessionTimeout}${mergedSettings.sessionSettings.timeoutUnit === "minutes" ? "分" : mergedSettings.sessionSettings.timeoutUnit === "hours" ? "時間" : "日"}`}
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
                  <Switch checked={mergedSettings.mfaSettings.requireMFA} />
                </div>
                <div className="space-y-2">
                  <Label>パスワード有効期限</Label>
                  <Select defaultValue={mergedSettings.passwordPolicy.expiryDays.toString()}>
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
                  <Switch checked={mergedSettings.ipRestriction.enableIPRestriction} />
                </div>
                <div className="space-y-2">
                  <Label>セッションタイムアウト</Label>
                  <Select defaultValue={mergedSettings.sessionSettings.sessionTimeout.toString()}>
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

          <Tabs defaultValue="account" className="space-y-4 mt-8">
            <TabsList>
              <TabsTrigger value="account">アカウントセキュリティ</TabsTrigger>
              <TabsTrigger value="access">アクセス制御</TabsTrigger>
              <TabsTrigger value="system">システムセキュリティ</TabsTrigger>
            </TabsList>

            <TabsContent value="account" className="space-y-4">
              <AccountLockoutSettings initialSettings={mergedSettings.accountLockout} />
              <PasswordPolicySettings initialSettings={mergedSettings.passwordPolicy} />
              <MFASettings initialSettings={mergedSettings.mfaSettings} />
              <SessionSettings initialSettings={mergedSettings.sessionSettings} />
            </TabsContent>

            <TabsContent value="access" className="space-y-4">
              <IPRestrictionSettings initialSettings={mergedSettings.ipRestriction} />
              <WAFSettings initialSettings={mergedSettings.wafSettings} />
            </TabsContent>

            <TabsContent value="system" className="space-y-4">
              <BackupSettings initialSettings={mergedSettings.backupSettings} />
              <VulnerabilitySettings initialSettings={mergedSettings.vulnerabilitySettings} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}