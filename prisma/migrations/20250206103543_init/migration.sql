/*
  Warnings:

  - You are about to drop the column `image` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `User` table. All the data in the column will be lost.
  - Made the column `password` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "image",
DROP COLUMN "status",
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "password" SET NOT NULL;

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementRead" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementRead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrowserHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceInfo" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "BrowserHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrowserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "searchEngine" TEXT NOT NULL DEFAULT 'google',
    "startPage" TEXT NOT NULL DEFAULT 'school-hub://start',
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrowserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrowserBookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "icon" TEXT,
    "folderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrowserBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrowserBookmarkFolder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrowserBookmarkFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrowserSecurityRule" (
    "id" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "BrowserSecurityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrowserDownload" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "size" INTEGER,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrowserDownload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdBlockSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "customRules" TEXT[],
    "customSelectors" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdBlockSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnnouncementRead_userId_idx" ON "AnnouncementRead"("userId");

-- CreateIndex
CREATE INDEX "AnnouncementRead_announcementId_idx" ON "AnnouncementRead"("announcementId");

-- CreateIndex
CREATE INDEX "BrowserHistory_userId_idx" ON "BrowserHistory"("userId");

-- CreateIndex
CREATE INDEX "BrowserHistory_timestamp_idx" ON "BrowserHistory"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "BrowserSettings_userId_key" ON "BrowserSettings"("userId");

-- CreateIndex
CREATE INDEX "BrowserSettings_userId_idx" ON "BrowserSettings"("userId");

-- CreateIndex
CREATE INDEX "BrowserBookmark_userId_idx" ON "BrowserBookmark"("userId");

-- CreateIndex
CREATE INDEX "BrowserBookmark_folderId_idx" ON "BrowserBookmark"("folderId");

-- CreateIndex
CREATE INDEX "BrowserBookmarkFolder_userId_idx" ON "BrowserBookmarkFolder"("userId");

-- CreateIndex
CREATE INDEX "BrowserBookmarkFolder_parentId_idx" ON "BrowserBookmarkFolder"("parentId");

-- CreateIndex
CREATE INDEX "BrowserSecurityRule_pattern_idx" ON "BrowserSecurityRule"("pattern");

-- CreateIndex
CREATE INDEX "BrowserDownload_userId_idx" ON "BrowserDownload"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AdBlockSettings_userId_key" ON "AdBlockSettings"("userId");

-- CreateIndex
CREATE INDEX "AdBlockSettings_userId_idx" ON "AdBlockSettings"("userId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_serverId_idx" ON "Message"("serverId");

-- CreateIndex
CREATE INDEX "Server_ownerId_idx" ON "Server"("ownerId");

-- CreateIndex
CREATE INDEX "User_roleId_idx" ON "User"("roleId");

-- AddForeignKey
ALTER TABLE "AnnouncementRead" ADD CONSTRAINT "AnnouncementRead_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementRead" ADD CONSTRAINT "AnnouncementRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrowserHistory" ADD CONSTRAINT "BrowserHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrowserSettings" ADD CONSTRAINT "BrowserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrowserBookmark" ADD CONSTRAINT "BrowserBookmark_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "BrowserBookmarkFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrowserBookmark" ADD CONSTRAINT "BrowserBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrowserBookmarkFolder" ADD CONSTRAINT "BrowserBookmarkFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "BrowserBookmarkFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrowserBookmarkFolder" ADD CONSTRAINT "BrowserBookmarkFolder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrowserDownload" ADD CONSTRAINT "BrowserDownload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdBlockSettings" ADD CONSTRAINT "AdBlockSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
