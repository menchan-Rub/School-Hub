import { useEffect } from 'react'

interface KeyboardShortcutsProps {
  onNewTab: () => void
  onCloseTab: () => void
  onReload: () => void
  onBack: () => void
  onForward: () => void
  onBookmark: () => void
  onFind: () => void
  onDevTools: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
  onHistory: () => void
  onBookmarks: () => void
  onDownloads: () => void
  onSettings: () => void
}

export function useKeyboardShortcuts({
  onNewTab,
  onCloseTab,
  onReload,
  onBack,
  onForward,
  onBookmark,
  onFind,
  onDevTools,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onHistory,
  onBookmarks,
  onDownloads,
  onSettings,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command/Control キーが押されているかチェック
      const isMod = e.metaKey || e.ctrlKey

      if (isMod) {
        switch (e.key.toLowerCase()) {
          case 't':
            e.preventDefault()
            onNewTab()
            break
          case 'w':
            e.preventDefault()
            onCloseTab()
            break
          case 'r':
            e.preventDefault()
            onReload()
            break
          case '[':
            if (e.altKey) {
              e.preventDefault()
              onBack()
            }
            break
          case ']':
            if (e.altKey) {
              e.preventDefault()
              onForward()
            }
            break
          case 'd':
            e.preventDefault()
            onBookmark()
            break
          case 'f':
            e.preventDefault()
            onFind()
            break
          case 'i':
            if (e.shiftKey) {
              e.preventDefault()
              onDevTools()
            }
            break
          case '=':
            e.preventDefault()
            onZoomIn()
            break
          case '-':
            e.preventDefault()
            onZoomOut()
            break
          case '0':
            e.preventDefault()
            onZoomReset()
            break
          case 'y':
            e.preventDefault()
            onHistory()
            break
          case 'b':
            e.preventDefault()
            onBookmarks()
            break
          case 'j':
            e.preventDefault()
            onDownloads()
            break
          case ',':
            e.preventDefault()
            onSettings()
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    onNewTab,
    onCloseTab,
    onReload,
    onBack,
    onForward,
    onBookmark,
    onFind,
    onDevTools,
    onZoomIn,
    onZoomOut,
    onZoomReset,
    onHistory,
    onBookmarks,
    onDownloads,
    onSettings,
  ])
} 