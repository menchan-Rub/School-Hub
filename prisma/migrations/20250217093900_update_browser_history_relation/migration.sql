/*
  Warnings:

  - You are about to drop the column `deviceInfo` on the `BrowserHistory` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `BrowserHistory` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `BrowserHistory` table. All the data in the column will be lost.
  - The `attachments` column on the `Message` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `icon` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `ServerMember` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `roleId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BrowserSecurityRule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Channel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MessageLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Role` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,announcementId]` on the table `AnnouncementRead` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[serverId,userId]` on the table `ServerMember` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `defaultRoleId` to the `Server` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AnnouncementRead" DROP CONSTRAINT "AnnouncementRead_announcementId_fkey";

-- DropForeignKey
ALTER TABLE "Channel" DROP CONSTRAINT "Channel_serverId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_channelId_fkey";

-- DropForeignKey
ALTER TABLE "ServerMember" DROP CONSTRAINT "ServerMember_serverId_fkey";

-- DropForeignKey
ALTER TABLE "ServerMember" DROP CONSTRAINT "ServerMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_roleId_fkey";

-- DropForeignKey
ALTER TABLE "UserSession" DROP CONSTRAINT "UserSession_userId_fkey";

-- DropIndex
DROP INDEX "BrowserHistory_timestamp_idx";

-- DropIndex
DROP INDEX "User_roleId_idx";

-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "targetUsers" TEXT[],
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'INFO';

-- AlterTable
ALTER TABLE "BrowserHistory" DROP COLUMN "deviceInfo",
DROP COLUMN "status",
DROP COLUMN "timestamp",
ADD COLUMN     "blocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "editedTimestamp" TIMESTAMP(3),
ADD COLUMN     "embeds" JSONB[],
ADD COLUMN     "mentionEveryone" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mentionRoles" TEXT[],
ADD COLUMN     "mentionUsers" TEXT[],
ADD COLUMN     "nonce" TEXT,
ADD COLUMN     "pinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reactions" JSONB[],
ADD COLUMN     "replyToId" TEXT,
ADD COLUMN     "threadId" TEXT,
ADD COLUMN     "tts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'DEFAULT',
DROP COLUMN "attachments",
ADD COLUMN     "attachments" JSONB[];

-- AlterTable
ALTER TABLE "Server" DROP COLUMN "icon",
ADD COLUMN     "defaultMessageNotifications" TEXT NOT NULL DEFAULT 'ALL_MESSAGES',
ADD COLUMN     "defaultRoleId" TEXT NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "explicitContentFilter" TEXT NOT NULL DEFAULT 'DISABLED',
ADD COLUMN     "features" TEXT[],
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "maxMembers" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "memberCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "region" TEXT NOT NULL DEFAULT 'japan',
ADD COLUMN     "rulesChannelId" TEXT,
ADD COLUMN     "systemChannelId" TEXT;

-- AlterTable
ALTER TABLE "ServerMember" DROP COLUMN "role",
ADD COLUMN     "communicationDisabledUntil" TIMESTAMP(3),
ADD COLUMN     "nickname" TEXT,
ADD COLUMN     "roles" TEXT[];

-- AlterTable
ALTER TABLE "User" DROP COLUMN "password",
DROP COLUMN "roleId",
ADD COLUMN     "emailVerified" TIMESTAMP(3),
ADD COLUMN     "image" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- DropTable
DROP TABLE "AuditLog";

-- DropTable
DROP TABLE "BrowserSecurityRule";

-- DropTable
DROP TABLE "Channel";

-- DropTable
DROP TABLE "MessageLog";

-- DropTable
DROP TABLE "Role";

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServerRole" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "permissions" TEXT[],
    "mentionable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServerRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServerChannel" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "topic" TEXT,
    "nsfw" BOOLEAN NOT NULL DEFAULT false,
    "rateLimitPerUser" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,
    "lastMessageId" TEXT,
    "permissionOverwrites" JSONB[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServerChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServerInvite" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "maxUses" INTEGER,
    "maxAge" INTEGER,
    "temporary" BOOLEAN NOT NULL DEFAULT false,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ServerInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLogEntry" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "executorId" TEXT NOT NULL,
    "targetId" TEXT,
    "changes" JSONB[],
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "notifications" JSONB NOT NULL,
    "privacy" JSONB NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'ja',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Tokyo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrowserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivity" TIMESTAMP(3) NOT NULL,
    "userAgent" TEXT NOT NULL,

    CONSTRAINT "BrowserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrowserTab" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "favicon" TEXT,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrowserTab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrowserSecurityAlert" (
    "id" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrowserSecurityAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrowserPerformanceMetric" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metrics" JSONB NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrowserPerformanceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "ServerInvite_code_key" ON "ServerInvite"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE INDEX "BrowserSession_userId_idx" ON "BrowserSession"("userId");

-- CreateIndex
CREATE INDEX "BrowserSession_lastActivity_idx" ON "BrowserSession"("lastActivity");

-- CreateIndex
CREATE INDEX "BrowserTab_sessionId_idx" ON "BrowserTab"("sessionId");

-- CreateIndex
CREATE INDEX "BrowserTab_closed_idx" ON "BrowserTab"("closed");

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementRead_userId_announcementId_key" ON "AnnouncementRead"("userId", "announcementId");

-- CreateIndex
CREATE INDEX "BrowserHistory_url_idx" ON "BrowserHistory"("url");

-- CreateIndex
CREATE INDEX "BrowserHistory_visitedAt_idx" ON "BrowserHistory"("visitedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ServerMember_serverId_userId_key" ON "ServerMember"("serverId", "userId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerRole" ADD CONSTRAINT "ServerRole_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerChannel" ADD CONSTRAINT "ServerChannel_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerChannel" ADD CONSTRAINT "ServerChannel_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ServerChannel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerMember" ADD CONSTRAINT "ServerMember_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerMember" ADD CONSTRAINT "ServerMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerInvite" ADD CONSTRAINT "ServerInvite_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerInvite" ADD CONSTRAINT "ServerInvite_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "ServerChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerInvite" ADD CONSTRAINT "ServerInvite_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "ServerChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLogEntry" ADD CONSTRAINT "AuditLogEntry_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementRead" ADD CONSTRAINT "AnnouncementRead_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrowserSession" ADD CONSTRAINT "BrowserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrowserTab" ADD CONSTRAINT "BrowserTab_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "BrowserSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
