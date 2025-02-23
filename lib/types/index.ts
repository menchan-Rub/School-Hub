import type { Server as NetServer } from "http"
import type { Socket } from "net"
import type { NextApiResponse } from "next"
import type { Server as SocketIOServer } from "socket.io"

export interface NextApiResponseServerIO extends NextApiResponse {
  socket: Socket & {
    server: NetServer & {
      io: SocketIOServer
    }
  }
}

// ブラウザ関連の型定義
export interface BareClientOptions {
  timeout?: number
  keepalive?: boolean
  signal?: AbortSignal
}

export interface BrowserSettings {
  theme: 'light' | 'dark' | 'system'
  searchEngine: string
  startPage: string
  newTabPage: string
  downloadPath: string
  autoUpdateExtensions: boolean
  enableAdBlock: boolean
  enableDNT: boolean
  enableProxy: boolean
  proxyUrl?: string
}

export interface Tab {
  id: string
  url: string
  title: string
  favicon?: string
  loading: boolean
  secure: boolean
  error?: string
  canGoBack: boolean
  canGoForward: boolean
}

export interface HistoryEntry {
  id: string
  url: string
  title: string
  favicon?: string
  timestamp: number
  visitCount: number
  lastVisit: number
}

export interface BookmarkEntry {
  id: string
  url: string
  title: string
  favicon?: string
  folderId?: string
  createdAt: number
  updatedAt: number
  position: number
}

export interface BookmarkFolder {
  id: string
  name: string
  parentId?: string
  createdAt: number
  updatedAt: number
  position: number
}

export interface DownloadItem {
  id: string
  url: string
  filename: string
  state: 'in_progress' | 'completed' | 'cancelled' | 'failed'
  bytesReceived: number
  totalBytes: number
  startTime: number
  endTime?: number
  error?: string
}

export interface Extension {
  id: string
  name: string
  version: string
  description?: string
  enabled: boolean
  permissions: string[]
  icons?: { [size: string]: string }
  homepageUrl?: string
  optionsUrl?: string
}

export interface SecurityInfo {
  secure: boolean
  certificate?: {
    subject: string
    issuer: string
    validFrom: number
    validTo: number
    fingerprint: string
  }
  protocol?: string
  cipherSuite?: string
}

export interface ExtensionMessage {
  type: string
  payload: any
  sender: {
    id: string
    tab?: Tab
  }
}

export type BrowserEvent = 
  | { type: 'TAB_CREATED'; tab: Tab }
  | { type: 'TAB_UPDATED'; tab: Tab }
  | { type: 'TAB_REMOVED'; tabId: string }
  | { type: 'TAB_ACTIVATED'; tabId: string }
  | { type: 'DOWNLOAD_STARTED'; download: DownloadItem }
  | { type: 'DOWNLOAD_UPDATED'; download: DownloadItem }
  | { type: 'SECURITY_CHANGED'; url: string; info: SecurityInfo }
  | { type: 'HISTORY_UPDATED'; entry: HistoryEntry }
  | { type: 'BOOKMARK_ADDED'; bookmark: BookmarkEntry }
  | { type: 'BOOKMARK_REMOVED'; bookmarkId: string }
  | { type: 'SETTINGS_CHANGED'; settings: Partial<BrowserSettings> }
  | { type: 'EXTENSION_INSTALLED'; extension: Extension }
  | { type: 'EXTENSION_UNINSTALLED'; extensionId: string }
  | { type: 'EXTENSION_ENABLED'; extensionId: string }
  | { type: 'EXTENSION_DISABLED'; extensionId: string }
  | { type: 'EXTENSION_MESSAGE'; message: ExtensionMessage }

