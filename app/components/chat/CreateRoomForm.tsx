import React, { useState } from "react";
import { useSession } from "next-auth/react";

interface User {
  id: string;
  name: string | null;
  email: string;
}

export default function CreateRoomForm() {
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ユーザー検索
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("検索に失敗しました");
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error("ユーザー検索エラー:", error);
    }
  };

  // ユーザーの選択
  const toggleUser = (user: User) => {
    setSelectedUsers((prev) =>
      prev.some((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user]
    );
  };

  // ルーム作成
  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selectedUsers.length === 0) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/chat/room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          participants: selectedUsers.map((u) => u.id),
        }),
      });

      if (!response.ok) throw new Error("ルームの作成に失敗しました");

      // フォームをリセット
      setName("");
      setSearchQuery("");
      setSelectedUsers([]);
      setUsers([]);

      // 成功メッセージを表示
      alert("チャットルームを作成しました");
    } catch (error) {
      console.error("ルーム作成エラー:", error);
      alert("ルームの作成に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">新しいチャットルーム</h2>
      
      <form onSubmit={createRoom} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            ルーム名
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">
            参加者を検索
          </label>
          <input
            type="text"
            id="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchUsers(e.target.value);
            }}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {users.length > 0 && (
          <div className="mt-2 max-h-40 overflow-y-auto border rounded-md">
            {users.map((user) => (
              <div
                key={user.id}
                onClick={() => toggleUser(user)}
                className={`p-2 cursor-pointer hover:bg-gray-100 ${
                  selectedUsers.some((u) => u.id === user.id)
                    ? "bg-blue-50"
                    : ""
                }`}
              >
                <p className="text-sm">{user.name || user.email}</p>
              </div>
            ))}
          </div>
        )}

        {selectedUsers.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              選択された参加者:
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full flex items-center"
                >
                  <span>{user.name || user.email}</span>
                  <button
                    type="button"
                    onClick={() => toggleUser(user)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !name.trim() || selectedUsers.length === 0}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? "作成中..." : "ルームを作成"}
        </button>
      </form>
    </div>
  );
} 