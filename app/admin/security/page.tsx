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

export default function SecurityPage() {
  const { data: session, status } = useSession()

  const { data: settings, isLoading } = useQuery<SecuritySettings>({
    queryKey: ['securitySettings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/security/settings')
      if (!res.ok) throw new Error('Failed to fetch security settings')
      return res.json()
    },
    enabled: !!session && ["super_admin", "admin"].includes(session.user.role)
  })

  if (status === "loading" || isLoading) {
    return <LoadingSpinner />
  }

  if (!session) {
    redirect("/login")
  }

  if (!["super_admin", "admin"].includes(session.user.role)) {
    redirect("/dashboard")
  }

  const securityScore = settings ? 
    (settings.twoFactorEnabled ? 40 : 0) + 
    (settings.ipRestrictionEnabled ? 30 : 0) + 
    (settings.passwordExpiry !== "never" ? 30 : 0) : 0

  return (
    <div className="p-6 space-y-8">
      <AdminPageHeader
        title="Security Settings"
        subtitle="Configure system-wide security settings"
        badge="Security Control"
      />

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text">
              Security Center
            </h2>
            <Badge variant="premium" className="uppercase">
              Defense Matrix
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Configure and monitor system security settings
          </p>
        </div>
        <Badge 
          variant={securityScore >= 70 ? "success" : securityScore >= 40 ? "warning" : "destructive"} 
          className="gap-1"
        >
          <ShieldCheck className="h-3 w-3" />
          Security Score: {securityScore}%
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <StatsCard 
          icon={Lock} 
          label="2FA Status" 
          value={settings?.twoFactorEnabled ? "Enabled" : "Disabled"}
          description="Two-factor authentication"
          trend={settings?.twoFactorEnabled ? { value: 40, isPositive: true } : undefined}
        />
        <StatsCard 
          icon={Activity} 
          label="Session Timeout" 
          value={settings?.sessionTimeout || "Not Set"}
          description="Automatic logout period"
        />
        <StatsCard 
          icon={AlertTriangle} 
          label="Security Alerts" 
          value="0"
          description="No active threats"
          trend={{ value: 0, isPositive: true }}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Authentication Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Require 2FA for all admin accounts
                </p>
              </div>
              <Switch checked={settings?.twoFactorEnabled} />
            </div>
            <div className="space-y-2">
              <Label>Password Expiry</Label>
              <Select defaultValue={settings?.passwordExpiry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select expiry period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="60">60 Days</SelectItem>
                  <SelectItem value="90">90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              Access Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>IP Restriction</Label>
                <p className="text-sm text-muted-foreground">
                  Limit access to specific IP ranges
                </p>
              </div>
              <Switch checked={settings?.ipRestrictionEnabled} />
            </div>
            <div className="space-y-2">
              <Label>Session Timeout</Label>
              <Select defaultValue={settings?.sessionTimeout}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timeout period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 Minutes</SelectItem>
                  <SelectItem value="30">30 Minutes</SelectItem>
                  <SelectItem value="60">1 Hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button 
          className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
        >
          Save Configuration
        </Button>
      </div>
    </div>
  )
}