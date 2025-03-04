import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        participantIn: true,
        createdRooms: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    // 参加中のルームと作成したルームを結合
    const rooms = [...user.participantIn, ...user.createdRooms];

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error("ルーム取得エラー:", error);
    return NextResponse.json(
      { error: "ルームの取得に失敗しました" },
      { status: 500 }
    );
  }
} 