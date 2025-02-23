import { AdminUser } from "@/lib/types"

export const mockUsers: AdminUser[] = [
  {
    id: "1",
    name: "テストユーザー1",
    email: "test1@example.com",
    role: "user",
    createdAt: new Date("2024-01-01"),
    lastLogin: new Date("2024-03-01")
  },
  {
    id: "2",
    name: "テストユーザー2",
    email: "test2@example.com",
    role: "admin",
    createdAt: new Date("2024-01-02"),
    lastLogin: new Date("2024-03-02")
  },
  {
    id: "3",
    name: "テストユーザー3",
    email: "test3@example.com",
    role: "user",
    createdAt: new Date("2024-01-03"),
    lastLogin: new Date("2024-03-03")
  }
]

export const mockServers = [
  {
    id: "1",
    name: "テストサーバー1",
    description: "テスト用のサーバー1です",
    memberCount: 10,
    createdAt: new Date("2024-01-01")
  },
  {
    id: "2",
    name: "テストサーバー2",
    description: "テスト用のサーバー2です",
    memberCount: 20,
    createdAt: new Date("2024-01-02")
  }
]

export const mockMessages = [
  {
    id: "1",
    content: "テストメッセージ1",
    authorId: "1",
    serverId: "1",
    channelId: "1",
    createdAt: new Date("2024-03-01T10:00:00")
  },
  {
    id: "2",
    content: "テストメッセージ2",
    authorId: "2",
    serverId: "1",
    channelId: "1",
    createdAt: new Date("2024-03-01T10:01:00")
  }
]

export const mockAnnouncements = [
  {
    id: "1",
    title: "システムメンテナンスのお知らせ",
    content: "明日の午前2時からシステムメンテナンスを実施します。",
    type: "INFO",
    priority: 1,
    isRead: false,
    createdAt: new Date("2024-03-01").toISOString()
  },
  {
    id: "2",
    title: "セキュリティアップデート",
    content: "重要なセキュリティアップデートがあります。",
    type: "WARNING",
    priority: 2,
    isRead: false,
    createdAt: new Date("2024-03-02").toISOString()
  }
] 