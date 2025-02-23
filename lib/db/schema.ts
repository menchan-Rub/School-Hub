import { relations } from "drizzle-orm"
import { pgTable, text, timestamp, boolean, uuid, json, integer, varchar } from "drizzle-orm/pg-core"
import { InferModel } from 'drizzle-orm'
import { PgTableWithColumns } from 'drizzle-orm/pg-core'

// ユーザーテーブル
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  password: text("password"),
  role: text("role").default("user"),
  status: text("status").default("active"),
  customStatus: text("customStatus"),
  settings: json("settings").$type<{
    notifications: {
      messages: boolean
      mentions: boolean
      friends: boolean
      sounds: boolean
    }
    privacy: {
      showOnlineStatus: boolean
      allowFriendRequests: boolean
      allowDirectMessages: boolean
    }
    theme: "light" | "dark" | "system"
    language: string
  }>().default({
    notifications: {
      messages: true,
      mentions: true,
      friends: true,
      sounds: true,
    },
    privacy: {
      showOnlineStatus: true,
      allowFriendRequests: true,
      allowDirectMessages: true,
    },
    theme: "system",
    language: "ja",
  }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at").defaultNow(),
})

// サーバー（グループ）テーブル
export const servers = pgTable("servers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  image: text("image"),
  ownerId: uuid("ownerId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  settings: json("settings")
    .$type<{
      defaultRole: string
      publicJoin: boolean
      notifications: boolean
    }>()
    .default({
      defaultRole: "member",
      publicJoin: false,
      notifications: true,
    }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
})

// カテゴリーテーブル
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  serverId: uuid("serverId")
    .references(() => servers.id, { onDelete: "cascade" })
    .notNull(),
  position: integer("position").notNull(),
})

// チャンネルテーブル
export const channels = pgTable("channels", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // text, voice, video
  serverId: uuid("serverId")
    .references(() => servers.id, { onDelete: "cascade" })
    .notNull(),
  categoryId: uuid("categoryId").references(() => categories.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  settings: json("settings")
    .$type<{
      slowMode: boolean
      slowModeInterval: number
      isPrivate: boolean
      allowedRoles: string[]
    }>()
    .default({
      slowMode: false,
      slowModeInterval: 0,
      isPrivate: false,
      allowedRoles: ["@everyone"],
    }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
})

// スレッドテーブル
export const threads: PgTableWithColumns<any> = pgTable("threads", {
  id: uuid("id").defaultRandom().primaryKey(),
  channelId: uuid("channelId")
    .references(() => channels.id, { onDelete: "cascade" })
    .notNull(),
  parentMessageId: uuid("parentMessageId")
    .references(() => messages.id, { onDelete: "cascade" })
    .notNull(),
  participantIds: json("participantIds").$type<string[]>().default([]),
  lastMessageAt: timestamp("lastMessageAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
})

// メッセージテーブル
export const messages: PgTableWithColumns<any> = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  content: text("content").notNull(),
  userId: uuid("userId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  channelId: uuid("channelId")
    .references(() => channels.id, { onDelete: "cascade" })
    .notNull(),
  threadId: uuid("threadId").references(() => threads.id, { onDelete: "cascade" }),
  replyToId: uuid("replyToId").references(() => messages.id, { onDelete: "set null" }),
  attachments:
    json("attachments").$type<
      {
        type: string
        url: string
        name: string
        size: number
      }[]
    >(),
  mentions: json("mentions")
    .$type<{
      users: string[]
      roles: string[]
      everyone: boolean
    }>()
    .default({
      users: [],
      roles: [],
      everyone: false,
    }),
  edited: boolean("edited").default(false),
  deletedAt: timestamp("deletedAt", { mode: "date" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
})

export type Message = InferModel<typeof messages>

// サーバーメンバーシップテーブル
export const serverMembers = pgTable("serverMembers", {
  id: uuid("id").defaultRandom().primaryKey(),
  serverId: uuid("serverId")
    .references(() => servers.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("userId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  nickname: text("nickname"),
  roles: json("roles").$type<string[]>().default(["member"]).notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
})

// ロールテーブル
export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  serverId: uuid("serverId")
    .references(() => servers.id, { onDelete: "cascade" })
    .notNull(),
  color: text("color"),
  hoist: boolean("hoist").default(false),
  position: integer("position").notNull(),
  permissions: json("permissions")
    .$type<{
      manageServer: boolean
      manageChannels: boolean
      manageRoles: boolean
      manageMessages: boolean
      kickMembers: boolean
      banMembers: boolean
      createInvite: boolean
      sendMessages: boolean
      embedLinks: boolean
      attachFiles: boolean
      mentionEveryone: boolean
      voiceConnect: boolean
      voiceSpeak: boolean
      voiceVideo: boolean
      voiceScreenShare: boolean
    }>()
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
})

// フレンドシップテーブル
export const friendships = pgTable("friendships", {
  id: uuid("id").defaultRandom().primaryKey(),
  senderId: text("sender_id").notNull().references(() => users.id),
  receiverId: text("receiver_id").notNull().references(() => users.id),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// DMチャンネルテーブル（追加）
export const directMessages = pgTable("directMessages", {
  id: uuid("id").defaultRandom().primaryKey(),
  content: text("content").notNull(),
  senderId: uuid("senderId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  receiverId: uuid("receiverId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  attachments:
    json("attachments").$type<
      {
        type: string
        url: string
        name: string
        size: number
      }[]
    >(),
  read: boolean("read").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
})

// 通知テーブル（追加）
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  type: text("type").notNull(), // message, mention, friend_request, etc
  title: text("title").notNull(),
  content: text("content").notNull(),
  read: boolean("read").default(false),
  data: json("data").$type<{
    serverId?: string
    channelId?: string
    messageId?: string
    senderId?: string
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
})

export const browserTabs = pgTable("browserTabs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  icon: text("icon"),
  pinned: boolean("pinned").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
})

// ブックマークテーブル
export const bookmarks = pgTable("bookmarks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  icon: text("icon"),
  folderId: uuid("folderId").references(() => bookmarkFolders.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
})

// ブックマークフォルダテーブル
export const bookmarkFolders: PgTableWithColumns<any> = pgTable("bookmarkFolders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  parentId: uuid("parentId").references(() => bookmarkFolders.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
})

// 通話セッションテーブル
export const callSessions = pgTable("callSessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  channelId: uuid("channelId").references(() => channels.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // voice, video
  participants: json("participants")
    .$type<
      {
        userId: string
        peerId: string
        camera: boolean
        microphone: boolean
        screen: boolean
      }[]
    >()
    .default([]),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
})

// リレーション定義
export const usersRelations = relations(users, ({ many }) => ({
  serverMembers: many(serverMembers),
  messages: many(messages),
  ownedServers: many(servers),
  sentDirectMessages: many(directMessages, { relationName: "sender" }),
  receivedDirectMessages: many(directMessages, { relationName: "receiver" }),
  notifications: many(notifications),
  browserTabs: many(browserTabs),
  bookmarks: many(bookmarks),
  bookmarkFolders: many(bookmarkFolders),
}))

export const serversRelations = relations(servers, ({ many, one }) => ({
  categories: many(categories),
  channels: many(channels),
  members: many(serverMembers),
  roles: many(roles),
  owner: one(users, {
    fields: [servers.ownerId],
    references: [users.id],
  }),
}))

export const categoriesRelations = relations(categories, ({ many, one }) => ({
  channels: many(channels),
  server: one(servers, {
    fields: [categories.serverId],
    references: [servers.id],
  }),
}))

export const channelsRelations = relations(channels, ({ many, one }) => ({
  messages: many(messages),
  threads: many(threads),
  server: one(servers, {
    fields: [channels.serverId],
    references: [servers.id],
  }),
  category: one(categories, {
    fields: [channels.categoryId],
    references: [categories.id],
  }),
  callSessions: many(callSessions),
}))

export const messagesRelations = relations(messages, ({ one, many }) => ({
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
  channel: one(channels, {
    fields: [messages.channelId],
    references: [channels.id],
  }),
  thread: one(threads, {
    fields: [messages.threadId],
    references: [threads.id],
  }),
  replyTo: one(messages, {
    fields: [messages.replyToId],
    references: [messages.id],
  }),
}))

export const threadsRelations = relations(threads, ({ one, many }) => ({
  channel: one(channels, {
    fields: [threads.channelId],
    references: [channels.id],
  }),
  parentMessage: one(messages, {
    fields: [threads.parentMessageId],
    references: [messages.id],
  }),
  messages: many(messages),
}))

export const serverMembersRelations = relations(serverMembers, ({ one }) => ({
  server: one(servers, {
    fields: [serverMembers.serverId],
    references: [servers.id],
  }),
  user: one(users, {
    fields: [serverMembers.userId],
    references: [users.id],
  }),
}))

export const rolesRelations = relations(roles, ({ one }) => ({
  server: one(servers, {
    fields: [roles.serverId],
    references: [servers.id],
  }),
}))

export const directMessagesRelations = relations(directMessages, ({ one }) => ({
  sender: one(users, {
    fields: [directMessages.senderId],
    references: [users.id],
  }),
  receiver: one(users, {
    fields: [directMessages.receiverId],
    references: [users.id],
  }),
}))

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}))

export const browserTabsRelations = relations(browserTabs, ({ one }) => ({
  user: one(users, {
    fields: [browserTabs.userId],
    references: [users.id],
  }),
}))

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
  folder: one(bookmarkFolders, {
    fields: [bookmarks.folderId],
    references: [bookmarkFolders.id],
  }),
}))

export const bookmarkFoldersRelations = relations(bookmarkFolders, ({ one, many }) => ({
  user: one(users, {
    fields: [bookmarkFolders.userId],
    references: [users.id],
  }),
  parent: one(bookmarkFolders, {
    fields: [bookmarkFolders.parentId],
    references: [bookmarkFolders.id],
  }),
  bookmarks: many(bookmarks),
  subfolders: many(bookmarkFolders, { relationName: "parent" }),
}))

export const callSessionsRelations = relations(callSessions, ({ one }) => ({
  channel: one(channels, {
    fields: [callSessions.channelId],
    references: [channels.id],
  }),
}))

