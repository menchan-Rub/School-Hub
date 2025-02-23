export interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalServers: number
  totalMessages: number
  monthlyActiveUsers: Array<{
    date: string
    count: number
  }>
}

export interface AdminUser {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: Date
  lastLogin?: Date | null
}

export interface AdminServer {
  id: string
  name: string
  description: string | null
  memberCount: number
  createdAt: Date
}

export interface AdminMessage {
  id: string
  content: string
  authorId: string
  serverId: string
  channelId: string
  createdAt: Date
}

export interface SecurityAlert {
  id: string
  type: 'warning' | 'error' | 'info'
  message: string
  timestamp: Date
  resolved: boolean
}

export interface SystemStatus {
  status: 'operational' | 'degraded' | 'down'
  lastChecked: Date
  uptime: number
  activeConnections: number
} 