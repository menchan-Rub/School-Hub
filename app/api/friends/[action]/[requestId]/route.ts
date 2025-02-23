import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function POST(
  req: Request,
  { params }: { params: { action: string; requestId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { action, requestId } = params

    const request = await prisma.friend.findUnique({
      where: { id: requestId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    if (!request || (request.receiverId !== session.user.id && request.senderId !== session.user.id)) {
      return new NextResponse('Not found', { status: 404 })
    }

    if (action === 'accept') {
      await prisma.friend.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' }
      })
    } else if (action === 'reject') {
      await prisma.friend.delete({
        where: { id: requestId }
      })
    }

    return new NextResponse('Success', { status: 200 })
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 })
  }
} 