import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { createClient, MatrixClient } from "matrix-js-sdk";

interface ChatComponentProps {
  roomId: string;
}

export default function ChatComponent({ roomId }: ChatComponentProps) {
  const { data: session } = useSession();
  const [client, setClient] = useState<MatrixClient | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initClient = async () => {
      if (!session?.user?.email) return;

      try {
        // Matrixサーバーの認証
        const response = await fetch("/api/chat/matrix/auth", {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("認証に失敗しました");
        }

        const { accessToken } = await response.json();

        // Matrixクライアントの初期化
        const matrixClient = createClient({
          baseUrl: process.env.NEXT_PUBLIC_MATRIX_HOME_SERVER,
          accessToken,
        });

        // メッセージの受信設定
        matrixClient.on("Room.timeline", (event: any) => {
          if (event.getType() === "m.room.message" && event.getRoomId() === roomId) {
            setMessages((prev) => [...prev, event]);
          }
        });

        await matrixClient.startClient();
        setClient(matrixClient);
        setIsLoading(false);
      } catch (error) {
        console.error("Matrixクライアントの初期化エラー:", error);
        setIsLoading(false);
      }
    };

    initClient();

    return () => {
      if (client) {
        client.stopClient();
      }
    };
  }, [session, roomId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements.namedItem("message") as HTMLInputElement;
    const message = input.value.trim();

    if (!message || !client) return;

    try {
      await client.sendTextMessage(roomId, message);
      input.value = "";
    } catch (error) {
      console.error("メッセージ送信エラー:", error);
    }
  };

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((event, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow p-3"
          >
            <p className="text-sm text-gray-500">
              {event.getSender()}
            </p>
            <p className="mt-1">
              {event.getContent().body}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            name="message"
            placeholder="メッセージを入力..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none"
          >
            送信
          </button>
        </div>
      </form>
    </div>
  );
} 