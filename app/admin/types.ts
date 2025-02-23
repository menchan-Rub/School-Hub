export interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalServers: number
  totalMessages: number
  monthlyActiveUsers: { date: string; count: number }[]
}

export interface SecuritySettings {
  twoFactorEnabled: boolean
  ipRestrictionEnabled: boolean
  passwordExpiry: string
  sessionTimeout: string
} 