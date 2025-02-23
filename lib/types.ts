export type UserRole = 'super_admin' | 'admin' | 'user'
export type UserStatus = 'active' | 'inactive' | 'banned' | 'offline'
export type AuditAction = 'create' | 'update' | 'delete' | 'ban' | 'unban'

export interface User {
  id: string
  name: string
  email: string
  image?: string
  role: 'super_admin' | 'admin' | 'user'
  status: 'active' | 'inactive' | 'banned'
  createdAt: string
  lastLogin: string
  banType?: "temporary" | "permanent"
  reason?: string
  bannedAt?: string
}

export interface Server {
  id: string
  name: string
  ownerName: string
  memberCount: number
  messageCount: number
  boostLevel: number
  status: "online" | "offline" | "maintenance"
  isVerified: boolean
}

export interface AuditLog {
  id: string
  action: "create" | "update" | "delete" | "login"
  details: string
  adminId: string
  createdAt: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  status: "draft" | "published"
  author: string
}

export interface Role {
  id: string
  name: string
  permissions: Record<string, string[]>
  isCustom: boolean
  createdAt: string
  updatedAt: string
}

export interface SecuritySettings {
  twoFactorEnabled: boolean
  passwordExpiry: string
  ipRestrictionEnabled: boolean
  sessionTimeout: string
  lastUpdated: string
}

export interface Message {
  id: string
  content: string
  userId: string
  channelId: string
  createdAt: string
  updatedAt?: string
}

export interface BrowserSettings {
  searchEngine: string
  startPage: string
  privateMode: boolean
  blockAds: boolean
  blockTrackers: boolean
  theme: 'light' | 'dark' | 'system'
}

export interface HistoryEntry {
  id: string
  url: string
  title: string
  favicon?: string
  timestamp: number
}

export interface Bookmark {
  id: string
  url: string
  title: string
  favicon?: string
  folderId?: string
}

export interface BookmarkFolder {
  id: string
  name: string
  parentId?: string
}

export interface DownloadItem {
  id: string
  url: string
  filename: string
  progress: number
  status: 'pending' | 'downloading' | 'completed' | 'error'
  error?: string
  startTime: number
  endTime?: number
}

export interface Channel {
  id: string
  name: string
  serverId: string
  type: 'text' | 'voice'
  isPrivate: boolean
} 