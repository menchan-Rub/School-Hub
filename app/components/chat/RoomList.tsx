import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import ChatComponent from "./ChatComponent";

interface Room {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
}

export default function RoomList() {
  const { data: session } = useSession();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      if (!session?.user?.email) return;

      try {
        const response = await fetch("/api/chat/rooms");
        if (!response.ok) throw new Error("ルームの取得に失敗しました");
        const data = await response.json();
        setRooms(data.rooms);
      } catch (error) {
        console.error("ルーム取得エラー:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRooms();
  }, [session]);

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  if (rooms.length === 0) {
    return (
      <p className="text-gray-500 text-center">
        参加しているチャットルームがありません
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {rooms.map((room) => (
        <div
          key={room.id}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h2 className="text-xl font-semibold mb-4">
            ルーム: {room.id}
          </h2>
          <div className="h-96">
            <ChatComponent roomId={room.id} />
          </div>
        </div>
      ))}
    </div>
  );
} 