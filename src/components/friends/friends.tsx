'use client';

interface FriendsProps {
  onBack: () => void;
}

export function Friends({ onBack }: FriendsProps) {
  return (
    <div className="h-full p-4">
      <div className="flex items-center mb-4">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-secondary"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold ml-4">フレンド</h1>
      </div>

      {/* フレンドリスト機能の実装 */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <input
            type="text"
            placeholder="フレンドを検索..."
            className="px-4 py-2 rounded-lg border"
          />
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
            フレンドを追加
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* フレンドカードのリスト */}
        </div>
      </div>
    </div>
  );
} 