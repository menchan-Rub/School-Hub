import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // クエリパラメータを取得
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ users: [] });
    }

    // ユーザーを検索（自分以外）
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          },
          { email: { not: session.user.email } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: 10, // 最大10件まで
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("ユーザー検索エラー:", error);
    return NextResponse.json(
      { error: "ユーザーの検索に失敗しました" },
      { status: 500 }
    );
  }
} 