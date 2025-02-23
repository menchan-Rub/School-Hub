"use client"

import { Component, ErrorInfo, ReactNode } from "react"
import { Shield, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("エラー詳細:", error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <Shield className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">問題が発生しました</h2>
          <p className="text-muted-foreground mb-4">
            申し訳ありません。エラーが発生しました。
          </p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            再読み込み
          </Button>
        </div>
      )
    }

    return this.props.children
  }
} 