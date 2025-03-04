"use client"

import React from "react";
import { useSession } from "next-auth/react";
import ChatComponent from "../components/chat/ChatComponent";
import CreateRoomForm from "../components/chat/CreateRoomForm";
import RoomList from "../components/chat/RoomList";

export default function ChatPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">ログインが必要です</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">チャット</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <CreateRoomForm />
        </div>

        <div className="lg:col-span-3">
          <RoomList />
        </div>
      </div>
    </div>
  );
} 