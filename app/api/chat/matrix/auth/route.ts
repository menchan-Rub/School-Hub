import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createClient } from "matrix-js-sdk";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // ユーザーを取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    // 既存のMatrixトークンがある場合は再利用
    if (user.matrixToken) {
      return NextResponse.json({ accessToken: user.matrixToken });
    }

    // 管理者クライアントを作成
    const adminClient = createClient({
      baseUrl: process.env.MATRIX_HOME_SERVER,
      userId: process.env.MATRIX_ADMIN_USER,
      password: process.env.MATRIX_ADMIN_PASSWORD,
    });

    try {
      // ユーザー名を生成（emailのドメイン部分を除去）
      const matrixUsername = user.email.split("@")[0];
      const matrixUserId = `@${matrixUsername}:${new URL(process.env.MATRIX_HOME_SERVER!).hostname}`;

      // ユーザーが存在するか確認
      try {
        await adminClient.registerGuest({
          username: matrixUsername,
          password: user.id, // ユーザーIDをパスワードとして使用
        });
      } catch (error) {
        // ユーザーが既に存在する場合は無視
        console.log("ユーザーは既に存在します:", error);
      }

      // ログイン
      const loginResponse = await adminClient.loginWithPassword(matrixUserId, user.id);
      const accessToken = loginResponse.access_token;

      // トークンをデータベースに保存
      await prisma.user.update({
        where: { id: user.id },
        data: { matrixToken: accessToken },
      });

      return NextResponse.json({ accessToken });
    } catch (error) {
      console.error("Matrix認証エラー:", error);
      return NextResponse.json(
        { error: "Matrix認証に失敗しました" },
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