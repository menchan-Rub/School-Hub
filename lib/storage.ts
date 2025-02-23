import localforage from 'localforage'
import { BookmarkEntry, HistoryEntry, DownloadItem, BrowserSettings } from './types/browser'

const SETTINGS_KEY = 'browser_settings'
const HISTORY_KEY = 'browser_history'
const BOOKMARKS_KEY = 'browser_bookmarks'

export class Storage {
  private settings: typeof localforage
  private history: typeof localforage
  private bookmarks: typeof localforage

  constructor() {
    this.settings = localforage.createInstance({
      name: 'browser',
      storeName: 'settings'
    })

    this.history = localforage.createInstance({
      name: 'browser',
      storeName: 'history'
    })

    this.bookmarks = localforage.createInstance({
      name: 'browser',
      storeName: 'bookmarks'
    })
  }

  async getBookmarks(): Promise<BookmarkEntry[]> {
    const bookmarks = await this.bookmarks.getItem<BookmarkEntry[]>(BOOKMARKS_KEY)
    return bookmarks || []
  }

  async addBookmark(entry: Omit<BookmarkEntry, 'id' | 'dateAdded' | 'dateModified'>): Promise<void> {
    const bookmarks = await this.getBookmarks()
    const newBookmark: BookmarkEntry = {
      ...entry,
      id: Math.random().toString(36).substr(2, 9),
      dateAdded: Date.now(),
      dateModified: Date.now()
    }
    bookmarks.push(newBookmark)
    await this.bookmarks.setItem(BOOKMARKS_KEY, bookmarks)
  }

  async updateBookmark(id: string, updates: Partial<BookmarkEntry>): Promise<void> {
    const bookmarks = await this.getBookmarks()
    const bookmark = bookmarks.find(b => b.id === id)
    if (bookmark) {
      Object.assign(bookmark, { ...updates, dateModified: Date.now() })
      await this.bookmarks.setItem(BOOKMARKS_KEY, bookmarks)
    }
  }

  async deleteBookmark(id: string): Promise<void> {
    const bookmarks = await this.getBookmarks()
    const filteredBookmarks = bookmarks.filter(bookmark => bookmark.id !== id)
    await this.bookmarks.setItem(BOOKMARKS_KEY, filteredBookmarks)
  }

  async getHistory(): Promise<HistoryEntry[]> {
    const history = await this.history.getItem<HistoryEntry[]>(HISTORY_KEY)
    return history || []
  }

  async addHistoryEntry(entry: Omit<HistoryEntry, 'id'>): Promise<void> {
    const history = await this.getHistory()
    const existingEntry = history.find(e => e.url === entry.url)

    if (existingEntry) {
      existingEntry.visitCount++
      existingEntry.lastVisit = Date.now()
    } else {
      const newEntry: HistoryEntry = {
        ...entry,
        id: Math.random().toString(36).substr(2, 9)
      }
      history.unshift(newEntry)
    }

    await this.history.setItem(HISTORY_KEY, history)
  }

  async clearHistory(): Promise<void> {
    await this.history.setItem(HISTORY_KEY, [])
  }

  async deleteHistoryEntry(id: string): Promise<void> {
    const history = await this.getHistory()
    const filteredHistory = history.filter(entry => entry.id !== id)
    await this.history.setItem(HISTORY_KEY, filteredHistory)
  }

  async getDownloads(): Promise<DownloadItem[]> {
    const stored = localStorage.getItem('downloads')
    return stored ? JSON.parse(stored) : []
  }

  async addDownload(download: Omit<DownloadItem, 'id'>): Promise<void> {
    const downloads = await this.getDownloads()
    const newDownload: DownloadItem = {
      ...download,
      id: Math.random().toString(36).slice(2)
    }
    downloads.push(newDownload)
    localStorage.setItem('downloads', JSON.stringify(downloads))
  }

  async updateDownload(id: string, updates: Partial<DownloadItem>): Promise<void> {
    const downloads = await this.getDownloads()
    const updated = downloads.map(d => 
      d.id === id ? { ...d, ...updates } : d
    )
    localStorage.setItem('downloads', JSON.stringify(updated))
  }

  async removeDownload(id: string): Promise<void> {
    const downloads = await this.getDownloads()
    const filtered = downloads.filter(d => d.id !== id)
    localStorage.setItem('downloads', JSON.stringify(filtered))
  }

  async clearDownloads(): Promise<void> {
    localStorage.removeItem('downloads')
  }

  async getSettings(): Promise<BrowserSettings> {
    const settings = await this.settings.getItem<BrowserSettings>(SETTINGS_KEY)
    if (!settings) {
      const defaultSettings: BrowserSettings = {
        startPage: 'https://www.google.com',
        searchEngine: 'google',
        privateMode: false,
        blockAds: false,
        blockTrackers: false,
        defaultDownloadPath: '',
        zoomLevel: 1,
        enableJavaScript: true,
        enableCookies: true,
        enableCache: true,
        userAgent: 'Ladybird/1.0',
        language: 'ja'
      }
      await this.settings.setItem(SETTINGS_KEY, defaultSettings)
      return defaultSettings
    }
    return settings
  }

  async saveSettings(settings: BrowserSettings): Promise<void> {
    await this.settings.setItem(SETTINGS_KEY, settings)
  }
} 