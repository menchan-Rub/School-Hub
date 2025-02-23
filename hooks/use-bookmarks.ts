import React, { useState } from 'react'

interface Bookmark {
  id: string
  title: string
  url: string
  favicon?: string
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])

  const addBookmark = (bookmark: Omit<Bookmark, 'id'>) => {
    setBookmarks(prev => [...prev, { ...bookmark, id: Math.random().toString(36).substr(2, 9) }])
  }

  const removeBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id))
  }

  return { bookmarks, addBookmark, removeBookmark }
} 