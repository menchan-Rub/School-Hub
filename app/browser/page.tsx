"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function BrowserPage() {
  const router = useRouter()

  useEffect(() => {
    // ブラウザアプリケーションを新しいウィンドウで開く
    window.open("http://localhost:3001", "_blank", "width=1200,height=800")
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">ブラウザを開いています...</h1>
      <p className="text-gray-600">新しいウィンドウでブラウザが開きます。</p>
      <button
        onClick={() => router.push("/")}
        className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
      >
        ホームに戻る
      </button>
    </div>
  )
} 