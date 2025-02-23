export function A11yProvider({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="application"
      aria-label="チャットアプリケーション"
      className="focus-visible:outline-none"
    >
      <div className="sr-only">
        <h1>School Hub チャットアプリケーション</h1>
        <p>学校コミュニティのためのチャットプラットフォーム</p>
      </div>
      {children}
    </div>
  )
} 