'use client';

interface AdminDashboardProps {
  onBack: () => void;
}

export function AdminDashboard({ onBack }: AdminDashboardProps) {
  return (
    <div className="p-4">
      <button onClick={onBack} className="mb-4">
        ← ダッシュボードに戻る
      </button>
      <h1 className="text-2xl font-bold">管理者ダッシュボード</h1>
      {/* 管理者機能をここに追加 */}
    </div>
  );
} 