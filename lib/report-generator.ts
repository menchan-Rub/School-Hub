import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

export async function generateActivityReport(days: number = 7) {
  const endDate = new Date()
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)

  const [messages, users, flaggedMessages] = await Promise.all([
    prisma.messageLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    }),
    prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    }),
    prisma.messageLog.findMany({
      where: {
        flagged: true,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })
  ])

  return {
    period: {
      start: format(startDate, 'yyyy/MM/dd', { locale: ja }),
      end: format(endDate, 'yyyy/MM/dd', { locale: ja })
    },
    summary: {
      totalMessages: messages.length,
      newUsers: users.length,
      flaggedMessages: flaggedMessages.length,
      averageMessagesPerDay: Math.round(messages.length / days)
    },
    details: {
      messageTypes: messages.reduce((acc: Record<string, number>, msg: { type: string }) => ({
        ...acc,
        [msg.type]: (acc[msg.type] || 0) + 1
      }), {} as Record<string, number>),
      flaggedMessageRatio: (flaggedMessages.length / messages.length * 100).toFixed(1)
    }
  }
} 