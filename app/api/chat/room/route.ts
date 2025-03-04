import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createClient } from "matrix-js-sdk";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    const { name, participants } = await request.json();

    // 管理者クライアントを作成
    const adminClient = createClient({
      baseUrl: process.env.MATRIX_HOME_SERVER,
      userId: process.env.MATRIX_ADMIN_USER,
      password: process.env.MATRIX_ADMIN_PASSWORD,
    });

    try {
      // Matrixルームを作成
      const { room_id } = await adminClient.createRoom({
        name,
        visibility: "private",
        preset: "private_chat",
      });

      // 参加者をルームに招待
      for (const participantId of participants) {
        const participant = await prisma.user.findUnique({
          where: { id: participantId },
        });

        if (participant) {
          const matrixUsername = participant.email.split("@")[0];
          const matrixUserId = `@${matrixUsername}:${new URL(process.env.MATRIX_HOME_SERVER!).hostname}`;
          await adminClient.invite(room_id, matrixUserId);
        }
      }

      // データベースにルームを保存
      const chatRoom = await prisma.chatRoom.create({
        data: {
          id: room_id,
          createdById: user.id,
          participants: {
            connect: [
              { id: user.id },
              ...participants.map((id: string) => ({ id })),
            ],
          },
        },
      });

      return NextResponse.json(chatRoom);
    } catch (error) {
      console.error("Matrixルーム作成エラー:", error);
      return NextResponse.json(
        { error: "ルームの作成に失敗しました" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("サーバーエラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
} 