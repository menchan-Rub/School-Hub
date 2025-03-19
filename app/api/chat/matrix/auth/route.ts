import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as sdk from "matrix-js-sdk";

// デフォルトのMatrixサーバー設定
const DEFAULT_MATRIX_HOME_SERVER = "https://matrix.org";
const DEFAULT_MATRIX_SERVER_NAME = "matrix.org";

// 自動生成する管理者アカウント情報
const generateAdminCredentials = (serverName: string) => {
  const randomString = Math.random().toString(36).substring(2, 10);
  return {
    userId: `@schoolhub_admin_${randomString}:${serverName}`,
    password: `admin_${randomString}_${Date.now()}`
  };
};

// Matrixクライアントの作成とセットアップ
async function setupMatrixClient(): Promise<any> {
  // ホームサーバーの設定
  const homeServer = process.env.MATRIX_HOME_SERVER || DEFAULT_MATRIX_HOME_SERVER;
  const serverName = process.env.MATRIX_SERVER_NAME || 
                     process.env.NEXT_PUBLIC_MATRIX_SERVER_NAME || 
                     new URL(homeServer).hostname || 
                     DEFAULT_MATRIX_SERVER_NAME;
  
  // 管理者アカウント情報
  let adminUser = process.env.MATRIX_ADMIN_USER;
  let adminPassword = process.env.MATRIX_ADMIN_PASSWORD;
  
  // 管理者アカウントが設定されていない場合は自動生成
  if (!adminUser || !adminPassword) {
    try {
      // システム設定から既存の管理者アカウントを取得
      const systemSettings = await prisma.systemSettings.findFirst({
        where: { id: 1 }
      });
      
      if (systemSettings?.matrixAdmin) {
        try {
          const matrixAdmin = JSON.parse(systemSettings.matrixAdmin);
          adminUser = matrixAdmin.userId;
          adminPassword = matrixAdmin.password;
        } catch (e) {
          console.log("既存の管理者アカウント情報の解析に失敗しました。新しく生成します。");
        }
      }
      
      // 管理者アカウントがまだ設定されていない場合は生成
      if (!adminUser || !adminPassword) {
        const adminCredentials = generateAdminCredentials(serverName);
        adminUser = adminCredentials.userId;
        adminPassword = adminCredentials.password;
        
        // 自動生成した管理者アカウント情報を保存
        await prisma.systemSettings.upsert({
          where: { id: 1 },
          update: {
            matrixAdmin: JSON.stringify({
              userId: adminUser,
              password: adminPassword,
              server: homeServer
            })
          },
          create: {
            id: 1,
            matrixAdmin: JSON.stringify({
              userId: adminUser,
              password: adminPassword,
              server: homeServer
            }),
            maintenance: false,
            language: "ja",
            autoBackup: true,
            queryLogging: true,
            defaultLocale: "ja-JP",
            timezone: "Asia/Tokyo"
          }
        });
      }
    } catch (error) {
      console.error("管理者アカウントの設定に失敗しました:", error);
      // エラーが発生しても続行できるようにデフォルト値を設定
      const adminCredentials = generateAdminCredentials(serverName);
      adminUser = adminCredentials.userId;
      adminPassword = adminCredentials.password;
    }
  }
  
  // Matrixクライアントの作成
  const client = sdk.createClient({
    baseUrl: homeServer
  });
  
  try {
    // 管理者アカウントの登録（存在しない場合）
    try {
      const username = adminUser?.replace(/^@/, '').split(':')[0];
      if (username) {
        await client.register(
          username, 
          adminPassword || 'defaultPassword', 
          undefined, // sessionId
          { type: "m.login.password" }
        );
        console.log("管理者アカウントを作成しました:", adminUser);
      }
    } catch (error) {
      // ユーザーが既に存在する場合のエラーは無視
      console.log("管理者アカウントはすでに存在するか、登録に失敗しました");
    }
    
    // 管理者アカウントとしてログイン
    if (adminUser && adminPassword) {
      try {
        const loginResponse = await client.login("m.login.password", {
          user: adminUser,
          password: adminPassword,
        });
        
        if (loginResponse?.access_token) {
          client.opts.accessToken = loginResponse.access_token;
          return client;
        }
      } catch (error) {
        console.error("管理者ログインに失敗しました:", error);
      }
    }
    
    return client;
  } catch (error) {
    console.error("Matrix管理者アカウントのセットアップに失敗しました:", error);
    return client;
  }
}

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
    if (user.matrixToken && user.matrixUserId) {
      return NextResponse.json({
        accessToken: user.matrixToken,
        userId: user.matrixUserId,
        homeServer: process.env.NEXT_PUBLIC_MATRIX_HOME_SERVER || DEFAULT_MATRIX_HOME_SERVER
      });
    }

    // Matrixクライアントのセットアップ
    const adminClient = await setupMatrixClient();
    
    // サーバー名の取得
    const serverName = process.env.MATRIX_SERVER_NAME || 
                       process.env.NEXT_PUBLIC_MATRIX_SERVER_NAME || 
                       DEFAULT_MATRIX_SERVER_NAME;

    try {
      // ユーザー名を生成（emailのドメイン部分を除去）
      const matrixUsername = user.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, '_');
      const matrixUserId = `@${matrixUsername}:${serverName}`;
      const userPassword = `${user.id}_${Date.now()}`;

      // ユーザーが存在するか確認し、なければ登録
      try {
        await adminClient.register(
          matrixUsername,
          userPassword,
          undefined,
          { type: "m.login.password" }
        );
        console.log(`新しいユーザーを登録しました: ${matrixUserId}`);
      } catch (error) {
        console.log(`ユーザー ${matrixUserId} は既に存在するか、登録に失敗しました`);
      }

      // ユーザーとしてログイン
      const tempClient = sdk.createClient({
        baseUrl: process.env.MATRIX_HOME_SERVER || DEFAULT_MATRIX_HOME_SERVER
      });
      
      try {
        const loginResponse = await tempClient.login("m.login.password", {
          user: matrixUserId,
          password: userPassword,
        });
        
        if (!loginResponse || !loginResponse.access_token) {
          throw new Error("ユーザーログインに失敗しました");
        }
        
        const accessToken = loginResponse.access_token;

        // トークンとユーザーIDをデータベースに保存
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            matrixToken: accessToken,
            matrixUserId: matrixUserId
          },
        });

        return NextResponse.json({
          accessToken,
          userId: matrixUserId,
          homeServer: process.env.MATRIX_HOME_SERVER || DEFAULT_MATRIX_HOME_SERVER
        });
      } catch (error) {
        console.error("ユーザーログインに失敗:", error);
        throw error;
      }
    } catch (error) {
      console.error("Matrix認証エラー:", error);
      return NextResponse.json(
        { error: "Matrix認証に失敗しました", details: error instanceof Error ? error.message : "不明なエラー" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("サーバーエラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", details: error instanceof Error ? error.message : "不明なエラー" },
      { status: 500 }
    );
  }
} 