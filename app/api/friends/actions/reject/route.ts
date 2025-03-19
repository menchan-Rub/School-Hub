import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { requestId } = body;

    if (!requestId) {
      return new NextResponse("Request ID is required", { status: 400 });
    }

    // フレンド申請を取得
    const friendRequest = await prisma.friend.findUnique({
      where: {
        id: requestId,
      },
    });

    if (!friendRequest) {
      return new NextResponse("Friend request not found", { status: 404 });
    }

    // 申請の受信者が現在のユーザーであることを確認
    if (friendRequest.receiverId !== session.user.id) {
      return new NextResponse("Unauthorized: Not the receiver of this request", { status: 403 });
    }

    // 申請の状態が保留中であることを確認
    if (friendRequest.status !== "PENDING") {
      return new NextResponse("This request has already been processed", { status: 400 });
    }

    // フレンド申請を拒否（削除）
    await prisma.friend.delete({
      where: {
        id: requestId,
      },
    });

    return NextResponse.json({ success: true, message: "Friend request rejected" });
  } catch (error) {
    console.error("フレンド申請拒否エラー:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 