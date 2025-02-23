import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/auth/permissions"
import { Prisma } from "@prisma/client"
import { Role } from "@prisma/client"

interface FormattedRole extends Omit<Role, 'createdAt' | 'updatedAt'> {
  isCustom: boolean
  createdAt: string
  updatedAt: string
  userCount: number
}

export const revalidate = 30 // 30秒間キャッシュ

export async function GET(): Promise<NextResponse<FormattedRole[]> | NextResponse> {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["admin", "super_admin"].includes(session.user.role)) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
        users: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    const formattedRoles: FormattedRole[] = roles.map(role => ({
      id: role.id,
      name: role.name,
      permissions: role.permissions as Record<string, string[]>,
      isCustom: !["super_admin", "admin", "user"].includes(role.name),
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
      userCount: role.users.length
    }))

    return NextResponse.json(formattedRoles)
  } catch (error) {
    console.error("[ROLES_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "super_admin") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { name, permissions } = await req.json()

    const role = await prisma.role.create({
      data: {
        name,
        permissions
      }
    })

    return NextResponse.json(role)
  } catch (error) {
    console.error("[ROLES_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    if (!hasPermission(session.user.role, "security", "edit")) {
      return new NextResponse("Permission denied", { status: 403 })
    }

    const updatedRoles = await req.json()

    // トランザクションで更新と監査ログを記録
    await prisma.$transaction(async (tx) => {
      // ロールの更新
      for (const role of updatedRoles) {
        await tx.role.update({
          where: { id: role.id },
          data: {
            permissions: {
              set: role.permissions
            } as Prisma.JsonObject,
            updatedAt: new Date()
          }
        })
      }

      // 監査ログの記録
      await tx.$executeRaw`
        INSERT INTO "AuditLog" ("id", "action", "adminId", "details", "targetType", "createdAt")
        VALUES (gen_random_uuid(), 'update', ${session.user.id}, '権限設定を更新', 'roles', NOW())
      `
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API Error:', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 