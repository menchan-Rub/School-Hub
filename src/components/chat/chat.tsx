'use client';

interface ChatProps {
  onBack: () => void;
}

export function Chat({ onBack }: ChatProps) {
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
        <h1 className="text-2xl font-bold ml-4">チャット</h1>
      </div>

      {/* チャット機能の実装 */}
      <div className="h-[calc(100%-4rem)] flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {/* メッセージリスト */}
        </div>
        <div className="mt-4">
          {/* メッセージ入力フォーム */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="メッセージを入力..."
              className="flex-1 px-4 py-2 rounded-lg border"
            />
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
              送信
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 