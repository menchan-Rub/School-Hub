export const mockStats = {
  totalUsers: 150,
  activeUsers: 85,
  totalServers: 25,
  totalMessages: 1250,
  bannedUsers: 23,
  announcements: 15,
  monthlyActiveUsers: [
    { date: "2024-03-01", count: 75 },
    { date: "2024-03-02", count: 82 },
    { date: "2024-03-03", count: 78 },
    { date: "2024-03-04", count: 85 },
    { date: "2024-03-05", count: 80 }
  ],
  monthlyStats: [
    {
      date: '2024-01-01',
      newUsers: 100,
      activeUsers: 500,
      messages: 2000
    },
    {
      date: '2024-02-01',
      newUsers: 120,
      activeUsers: 600,
      messages: 2400
    },
    {
      date: '2024-03-01',
      newUsers: 150,
      activeUsers: 750,
      messages: 3000
    },
    {
      date: '2024-04-01',
      newUsers: 180,
      activeUsers: 900,
      messages: 3600
    },
  ]
}

export const mockUsers = [
  {
    id: "1",
    name: "山田太郎",
    email: "yamada@example.com",
    role: "admin",
    status: "active",
    createdAt: "2024-01-01T00:00:00Z",
    lastLogin: "2024-03-15T10:00:00Z"
  },
  {
    id: "2",
    name: "鈴木花子",
    email: "suzuki@example.com",
    role: "user",
    status: "active",
    createdAt: "2024-01-15T00:00:00Z",
    lastLogin: "2024-03-14T15:30:00Z"
  }
]

export const mockBannedUsers = [
  {
    id: "3",
    name: "佐藤一郎",
    email: "sato@example.com",
    role: "user",
    status: "banned",
    banType: "temporary",
    reason: "不適切な発言",
    bannedAt: "2024-03-01T00:00:00Z"
  }
]

export const mockAuditLogs = [
  {
    id: "1",
    action: "ban",
    userId: "3",
    targetId: "user_3",
    details: "ユーザーを一時的にBANしました",
    createdAt: "2024-03-01T00:00:00Z"
  },
  {
    id: "2",
    action: "create",
    userId: "1",
    targetId: "announcement_1",
    details: "お知らせを作成しました",
    createdAt: "2024-03-10T09:00:00Z"
  }
]

export const mockRoles = [
  {
    id: "1",
    name: "管理者",
    permissions: ["all"],
    userCount: 2,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "2",
    name: "モデレーター",
    permissions: ["moderate", "view"],
    userCount: 5,
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z"
  }
]

export const mockAnnouncements = [
  {
    id: "1",
    title: "新機能のお知らせ",
    content: "チャット機能が更新されました。",
    published: true,
    createdAt: "2024-03-10T09:00:00Z",
    updatedAt: "2024-03-10T09:00:00Z"
  },
  {
    id: "2",
    title: "メンテナンス予定",
    content: "3月20日にシステムメンテナンスを実施します。",
    published: false,
    createdAt: "2024-03-12T15:00:00Z",
    updatedAt: "2024-03-12T15:00:00Z"
  }
]

export const mockServers = [
  {
    id: "1",
    name: "一般チャット",
    ownerName: "山田太郎",
    memberCount: 25,
    messageCount: 150,
    createdAt: "2024-02-01T00:00:00Z",
    lastActive: "2024-03-15T12:00:00Z"
  },
  {
    id: "2",
    name: "お知らせ",
    ownerName: "鈴木花子",
    memberCount: 15,
    messageCount: 75,
    createdAt: "2024-02-15T00:00:00Z",
    lastActive: "2024-03-14T18:00:00Z"
  }
]

// モックユーザーデータ
export const mockUser = {
  id: "mock-user-1",
  name: "テストユーザー",
  image: "/placeholder.svg"
}

// モックトークンデータ
export const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoibW9jay11c2VyLTEifQ.mock-signature"

// モックチャットデータ
export const mockChat = {
  messages: [
    {
      id: "msg-1",
      text: "こんにちは！",
      user: mockUser,
      createdAt: new Date().toISOString()
    }
  ],
  channels: [
    {
      id: "channel-1",
      name: "一般",
      type: "team"
    }
  ]
}

// Stream Chat用のモックデータ
export const mockStreamChat = {
  // デフォルトサーバー
  defaultServer: {
    id: "general",
    type: "team",
    name: "一般",
    created_by_id: "mock-user-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    member_count: 10,
    data: {
      name: "一般",
      image: "/placeholder.svg",
      member_count: 10
    }
  },

  // チャンネル（サーバー）のモックデータ
  channels: [
    {
      id: "general",
      type: "team",
      name: "一般",
      created_by_id: "mock-user-1",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      member_count: 10,
      data: {
        name: "一般",
        image: "/placeholder.svg",
        member_count: 10
      }
    }
  ],

  // サーバーチャンネルのモックデータ
  serverChannels: {
    "general": [
      {
        id: "general-announcements",
        type: "team",
        name: "お知らせ",
        created_by_id: "mock-user-1",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        member_count: 10,
        data: {
          name: "お知らせ",
          category: "Information"
        }
      },
      {
        id: "general-general",
        type: "team",
        name: "一般",
        created_by_id: "mock-user-1",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        member_count: 10,
        data: {
          name: "一般",
          category: "Text Channels"
        }
      },
      {
        id: "general-random",
        type: "team",
        name: "雑談",
        created_by_id: "mock-user-1",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        member_count: 8,
        data: {
          name: "雑談",
          category: "Text Channels"
        }
      }
    ]
  },

  // メッセージのモックデータ
  messages: [
    {
      id: "msg-1",
      text: "こんにちは！",
      user_id: "mock-user-1",
      user: {
        id: "mock-user-1",
        name: "テストユーザー",
        image: "/placeholder.svg"
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      type: "regular",
      attachments: []
    },
    {
      id: "msg-2",
      text: "よろしくお願いします！",
      user_id: "mock-user-2",
      user: {
        id: "mock-user-2",
        name: "テストユーザー2",
        image: "/placeholder.svg"
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      type: "regular",
      attachments: []
    }
  ]
}