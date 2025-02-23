interface SettingsProps {
  onBack: () => void
}

export const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  return (
    <div className="h-full p-8">
      <div className="flex items-center mb-8">
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
        <h1 className="text-2xl font-bold ml-4">設定</h1>
      </div>

      <div className="space-y-8">
        {/* TODO: 設定項目の実装 */}
      </div>
    </div>
  )
} 