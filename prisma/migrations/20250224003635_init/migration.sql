/*
  Warnings:

  - You are about to drop the `AdBlockSettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Announcement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AnnouncementRead` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AuditLogEntry` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BrowserBookmark` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BrowserBookmarkFolder` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BrowserDownload` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BrowserHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BrowserPerformanceMetric` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BrowserSecurityAlert` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BrowserSession` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BrowserSettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BrowserTab` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Friend` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Message` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Server` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServerChannel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServerInvite` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServerMember` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServerRole` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserSession` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserSettings` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `passwordHash` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "AdBlockSettings" DROP CONSTRAINT "AdBlockSettings_userId_fkey";

-- DropForeignKey
ALTER TABLE "AnnouncementRead" DROP CONSTRAINT "AnnouncementRead_announcementId_fkey";

-- DropForeignKey
ALTER TABLE "AnnouncementRead" DROP CONSTRAINT "AnnouncementRead_userId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLogEntry" DROP CONSTRAINT "AuditLogEntry_serverId_fkey";

-- DropForeignKey
ALTER TABLE "BrowserBookmark" DROP CONSTRAINT "BrowserBookmark_folderId_fkey";

-- DropForeignKey
ALTER TABLE "BrowserBookmark" DROP CONSTRAINT "BrowserBookmark_userId_fkey";

-- DropForeignKey
ALTER TABLE "BrowserBookmarkFolder" DROP CONSTRAINT "BrowserBookmarkFolder_parentId_fkey";

-- DropForeignKey
ALTER TABLE "BrowserBookmarkFolder" DROP CONSTRAINT "BrowserBookmarkFolder_userId_fkey";

-- DropForeignKey
ALTER TABLE "BrowserDownload" DROP CONSTRAINT "BrowserDownload_userId_fkey";

-- DropForeignKey
ALTER TABLE "BrowserHistory" DROP CONSTRAINT "BrowserHistory_userId_fkey";

-- DropForeignKey
ALTER TABLE "BrowserSession" DROP CONSTRAINT "BrowserSession_userId_fkey";

-- DropForeignKey
ALTER TABLE "BrowserSettings" DROP CONSTRAINT "BrowserSettings_userId_fkey";

-- DropForeignKey
ALTER TABLE "BrowserTab" DROP CONSTRAINT "BrowserTab_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "Friend" DROP CONSTRAINT "Friend_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "Friend" DROP CONSTRAINT "Friend_senderId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_channelId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_replyToId_fkey";

-- DropForeignKey
ALTER TABLE "Server" DROP CONSTRAINT "Server_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "ServerChannel" DROP CONSTRAINT "ServerChannel_parentId_fkey";

-- DropForeignKey
ALTER TABLE "ServerChannel" DROP CONSTRAINT "ServerChannel_serverId_fkey";

-- DropForeignKey
ALTER TABLE "ServerInvite" DROP CONSTRAINT "ServerInvite_channelId_fkey";

-- DropForeignKey
ALTER TABLE "ServerInvite" DROP CONSTRAINT "ServerInvite_inviterId_fkey";

-- DropForeignKey
ALTER TABLE "ServerInvite" DROP CONSTRAINT "ServerInvite_serverId_fkey";

-- DropForeignKey
ALTER TABLE "ServerMember" DROP CONSTRAINT "ServerMember_serverId_fkey";

-- DropForeignKey
ALTER TABLE "ServerMember" DROP CONSTRAINT "ServerMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "ServerRole" DROP CONSTRAINT "ServerRole_serverId_fkey";

-- DropForeignKey
ALTER TABLE "UserSession" DROP CONSTRAINT "UserSession_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserSettings" DROP CONSTRAINT "UserSettings_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordHash" TEXT NOT NULL,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'user',
ALTER COLUMN "email" SET NOT NULL;

-- DropTable
DROP TABLE "AdBlockSettings";

-- DropTable
DROP TABLE "Announcement";

-- DropTable
DROP TABLE "AnnouncementRead";

-- DropTable
DROP TABLE "AuditLogEntry";

-- DropTable
DROP TABLE "BrowserBookmark";

-- DropTable
DROP TABLE "BrowserBookmarkFolder";

-- DropTable
DROP TABLE "BrowserDownload";

-- DropTable
DROP TABLE "BrowserHistory";

-- DropTable
DROP TABLE "BrowserPerformanceMetric";

-- DropTable
DROP TABLE "BrowserSecurityAlert";

-- DropTable
DROP TABLE "BrowserSession";

-- DropTable
DROP TABLE "BrowserSettings";

-- DropTable
DROP TABLE "BrowserTab";

-- DropTable
DROP TABLE "Friend";

-- DropTable
DROP TABLE "Message";

-- DropTable
DROP TABLE "Server";

-- DropTable
DROP TABLE "ServerChannel";

-- DropTable
DROP TABLE "ServerInvite";

-- DropTable
DROP TABLE "ServerMember";

-- DropTable
DROP TABLE "ServerRole";

-- DropTable
DROP TABLE "UserSession";

-- DropTable
DROP TABLE "UserSettings";

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
