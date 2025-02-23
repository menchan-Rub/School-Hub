export default function BrowserErrorPage() {
  return (
    <div className="container mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold mb-4">エラーが発生しました</h1>
      <p className="text-muted-foreground mb-4">
        ページの読み込み中にエラーが発生しました。
      </p>
      <Button onClick={() => window.history.back()}>
        前のページに戻る
      </Button>
    </div>
  );
} 