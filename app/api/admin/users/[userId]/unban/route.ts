import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function POST(
  req: Request,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "admin") {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  await db.update(users)
    .set({ status: "active" })
    .where(eq(users.id, params.userId))

  return new NextResponse(null, { status: 200 })
} 