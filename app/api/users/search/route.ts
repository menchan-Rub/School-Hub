import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // URLパラメータからemail検索条件を取得
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    
    if (!email) {
      return NextResponse.json({ users: [] });
    }

    // ユーザーを検索
    const users = await prisma.user.findMany({
      where: {
        email: {
          contains: email,
          mode: 'insensitive'
        },
        // 自分自身を除外
        id: {
          not: session.user.id
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      },
      take: 5 // 最大5件まで
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("ユーザー検索エラー:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 