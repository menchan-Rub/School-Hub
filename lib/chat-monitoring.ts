import { StreamChat } from 'stream-chat'
import { prisma } from '@/lib/prisma'

export class ChatMonitor {
  private client: StreamChat

  constructor() {
    this.client = StreamChat.getInstance(
      process.env.NEXT_PUBLIC_STREAM_KEY!,
      process.env.STREAM_SECRET_KEY!
    )
  }

  async trackMessage(message: any) {
    try {
      // メッセージの監視ログを保存
      await prisma.messageLog.create({
        data: {
          messageId: message.id,
          channelId: message.channel_id,
          userId: message.user_id,
          content: message.text,
          type: 'message',
          flagged: this.shouldFlagMessage(message.text),
          metadata: {
            attachments: message.attachments,
            mentions: message.mentioned_users
          }
        }
      })
    } catch (error) {
      console.error('Failed to track message:', error)
    }
  }

  private shouldFlagMessage(content: string): boolean {
    const flaggedWords = ['不適切', 'spam', '迷惑']
    return flaggedWords.some(word => content.toLowerCase().includes(word))
  }

  async getMessageStats() {
    const stats = await prisma.messageLog.groupBy({
      by: ['type'],
      _count: {
        _all: true
      },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 過去24時間
        }
      }
    })

    return {
      total: stats.reduce((acc, curr) => acc + curr._count._all, 0),
      flagged: await prisma.messageLog.count({
        where: { flagged: true }
      })
    }
  }
}

export const chatMonitor = new ChatMonitor() 